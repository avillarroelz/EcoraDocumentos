package com.ecora.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OpenExternalPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
