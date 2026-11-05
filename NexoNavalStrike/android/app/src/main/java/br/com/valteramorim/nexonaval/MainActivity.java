package br.com.valteramorim.nexonaval;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/** Nexo Naval Strike 3D: tela cheia imersiva em paisagem, tela sempre ligada durante o jogo. 100% offline. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        try {
            android.webkit.WebSettings ws = getBridge().getWebView().getSettings();
            ws.setSupportZoom(false); ws.setBuiltInZoomControls(false); ws.setDisplayZoomControls(false); ws.setTextZoom(100);
            ws.setMediaPlaybackRequiresUserGesture(false);
            getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
        } catch (Exception ignored) {}
        imersivo();
    }

    private void imersivo() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) imersivo();
    }

    @Override
    public void onResume() { super.onResume(); imersivo(); }
}
