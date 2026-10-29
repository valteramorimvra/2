// g++ -std=c++17 -O2 -Wall -Wextra teste_audio.cpp -o teste_audio && ./teste_audio
#include "AudioConcurrencyManager.hpp"
#include <cstdio>
using namespace nexo::audio;
int main() {
  AudioConcurrencyManager<32> m;
  double t = 0.0; int nuke = -1;
  for (int k = 0; k < 600; ++k, t += 1.0 / 60.0) {            // 10 s de batalha intensa a 60 Hz
    for (int c = 0; c < 3; ++c) m.request({uint32_t(10 + c), Tier::Tactical, 0.6f, 800.f + c * 300.f, 2.5f, false}, t);   // salvas
    for (int c = 0; c < 6; ++c) m.request({uint32_t(40 + c), Tier::Ambient, 0.15f, 300.f + c * 90.f, 1.2f, false}, t);    // respingos
    m.request({77u, Tier::Secondary, 0.3f, 1500.f, 1.0f, false}, t);                                                       // estilhaços
    if (k == 300) nuke = m.request({999u, Tier::Critical, 1.0f, 3000.f, 12.f, false}, t);                                    // detonação nuclear
  }
  const Stats& s = m.stats();
  std::printf("tocadas=%u roubadas=%u descartadas=%u virtuais=%u agrupadas=%u ativas=%zu nuclear_slot=%d\n",
              s.played, s.stolen, s.dropped, s.virtualized, s.grouped, m.activeVoices(t), nuke);
  return (nuke >= 0 && m.activeVoices(t) <= 32) ? 0 : 1;
}
