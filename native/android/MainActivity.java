package com.oreac.astrokabbale;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OreacPrintPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
