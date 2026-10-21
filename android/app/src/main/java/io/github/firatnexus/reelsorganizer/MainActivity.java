package io.github.firatnexus.reelsorganizer;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ReelsBridgePlugin.class);
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
