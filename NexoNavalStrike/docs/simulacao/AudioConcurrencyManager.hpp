// AudioConcurrencyManager.hpp — Nexo Naval Strike (referência C++17 do gerenciador usado em src/NavalAudio.js, v1.2.53)
// Pool fixo de vozes físicas + camadas de prioridade determinística + virtualização silenciosa + descarte estocástico.
// Sem alocação no caminho quente: tudo pré-alocado no construtor; seguro para a thread de jogo (o mixer recebe só comandos).
#pragma once
#include <array>
#include <cstdint>
#include <cmath>
#include <algorithm>

namespace nexo::audio {

enum class Tier : uint8_t { Critical = 0, Tactical = 1, Secondary = 2, Ambient = 3 };

struct VoiceRequest {
  uint32_t soundId;      // id do buffer pré-carregado
  Tier tier;             // camada de prioridade
  float gain;            // ganho percebido já com distância (0..∞)
  float distance;        // m (para agrupar rajadas)
  float duration;        // s (tempo de vida da voz)
  bool protectedVoice;   // impacto no próprio navio / evento do jogador
};

struct Voice {
  bool active = false;
  uint32_t soundId = 0;
  Tier tier = Tier::Ambient;
  float gain = 0.f, distance = 0.f;
  double start = 0.0, end = 0.0;
  bool prot = false;
};

struct Stats { uint32_t played = 0, stolen = 0, dropped = 0, virtualized = 0, inaudible = 0, grouped = 0; };

template <size_t MaxPhysical = 32>
class AudioConcurrencyManager {
 public:
  static constexpr float kAudible = 0.01f;            // −40 dBFS: abaixo disso não ocupa canal
  static constexpr size_t kVirtTier2 = 24;             // acima disso, camadas 2–3 viram virtuais
  static constexpr size_t kVirtTier3 = 16;             // entre 16 e 24, camada 3 descartada com p = (n−16)/8
  static constexpr std::array<float, 4> kTierWeight{8.f, 2.f, 1.f, 0.6f};
  static constexpr std::array<uint8_t, 4> kTierLimit{8, 6, 4, 4};   // vozes máximas por camada

  explicit AudioConcurrencyManager(uint32_t seed = 0x9E3779B9u) : rng_(seed ? seed : 1u) {}

  // Retorna o índice da voz física usada, ou −1 (descartada / virtual / agrupada).
  int request(const VoiceRequest& r, double now) {
    if (r.gain < kAudible && !r.protectedVoice) { ++stats_.inaudible; return -1; }
    const Tier tier = r.protectedVoice ? Tier::Critical : r.tier;
    const auto ti = static_cast<size_t>(tier);

    // 1) RAJADA: mesmo som, mesmo instante (< 30 ms) e lugar (< 250 m) → soma de potência numa voz só
    for (size_t i = 0; i < MaxPhysical; ++i) {
      Voice& v = voices_[i];
      if (v.active && v.end > now && v.soundId == r.soundId && now - v.start < 0.03 && std::fabs(v.distance - r.distance) < 250.f) {
        v.gain = std::min(1.6f, std::sqrt(v.gain * v.gain + r.gain * r.gain)); ++stats_.grouped; return static_cast<int>(i);
      }
    }
    // 2) varredura O(N) sem alocação: livres, ocupação total e por camada, voz mais fraca (global e da camada)
    int freeIdx = -1, weakest = -1, weakestTier = -1; float wMin = 1e30f, wTierMin = 1e30f; size_t nTot = 0, nTier = 0;
    for (size_t i = 0; i < MaxPhysical; ++i) {
      Voice& v = voices_[i];
      if (!v.active || v.end <= now) { v.active = false; if (freeIdx < 0) freeIdx = static_cast<int>(i); continue; }
      ++nTot; const float pr = priority(v, now);
      if (v.tier == tier) { ++nTier; if (pr < wTierMin) { wTierMin = pr; weakestTier = static_cast<int>(i); } }
      if (pr < wMin) { wMin = pr; weakest = static_cast<int>(i); }
    }
    // 3) VIRTUALIZAÇÃO: camadas 2–3 sob pressão não instanciam DSP (só contam)
    if ((ti >= 2 && nTot >= kVirtTier2) || (ti == 3 && nTot >= kVirtTier3 && uniform() < float(nTot - kVirtTier3) / float(kVirtTier2 - kVirtTier3))) {
      ++stats_.virtualized; return -1;
    }
    const float pNew = r.gain * kTierWeight[ti] * (r.protectedVoice ? 4.f : 1.f);
    int slot = freeIdx;
    if (nTier >= kTierLimit[ti]) {                       // camada cheia → rouba a mais fraca DA CAMADA se a nova for mais forte
      if (weakestTier >= 0 && wTierMin < pNew) { slot = weakestTier; ++stats_.stolen; } else { ++stats_.dropped; return -1; }
    } else if (slot < 0 || nTot >= MaxPhysical) {        // pool cheio → rouba a mais fraca global
      if (weakest >= 0 && wMin < pNew) { slot = weakest; ++stats_.stolen; } else { ++stats_.dropped; return -1; }
    }
    Voice& v = voices_[static_cast<size_t>(slot)];
    v = Voice{true, r.soundId, tier, r.gain, r.distance, now, now + r.duration + 0.03, r.protectedVoice};
    ++stats_.played; return slot;
  }

  size_t activeVoices(double now) const { size_t n = 0; for (const auto& v : voices_) n += (v.active && v.end > now); return n; }
  const Stats& stats() const { return stats_; }

 private:
  // prioridade decai com a idade da voz (a cauda já é baixa): ganho × peso da camada × proteção / (1 + 2·idade)
  static float priority(const Voice& v, double now) {
    return v.gain * kTierWeight[static_cast<size_t>(v.tier)] * (v.prot ? 4.f : 1.f) / float(1.0 + 2.0 * (now - v.start));
  }
  float uniform() { rng_ ^= rng_ << 13; rng_ ^= rng_ >> 17; rng_ ^= rng_ << 5; return float(rng_ & 0xFFFFFF) / float(0x1000000); } // xorshift32
  std::array<Voice, MaxPhysical> voices_{};
  Stats stats_{};
  uint32_t rng_;
};

}  // namespace nexo::audio
