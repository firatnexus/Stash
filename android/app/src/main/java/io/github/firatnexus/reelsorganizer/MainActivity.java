package io.github.firatnexus.reelsorganizer;

import android.content.Intent;
import android.os.Bundle;

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
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        ReelsBridgePlugin.handleIntent(intent);
    }
}
