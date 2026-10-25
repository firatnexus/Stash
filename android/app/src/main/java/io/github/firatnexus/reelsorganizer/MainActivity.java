package io.github.firatnexus.reelsorganizer;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ReelsBridgePlugin.class);
        // Native splash (brand colors + animated mark). Kept on screen until the
        // web layer has painted its first frame (or a 3s safety timeout), so the
        // hand-off to the home screen is seamless — no white flash, no loading screen.
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> !ReelsBridgePlugin.isFirstFrameReady());
        super.onCreate(savedInstanceState);
        if (savedInstanceState == null) ReelsBridgePlugin.handleIntent(getIntent());
    }

    @Override
    public void onStart() {
        super.onStart();
        // The Android WebView draws its own vertical scrollbar overlay while
        // scrolling (rendered on the left edge on current WebView versions).
        // Hide just that indicator — touch scrolling, inner scrollable areas and
        // the horizontal scrollbar are unaffected.
        WebView wv = getBridge() == null ? null : getBridge().getWebView();
        if (wv != null) wv.setVerticalScrollBarEnabled(false);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        ReelsBridgePlugin.handleIntent(intent);
    }
}
