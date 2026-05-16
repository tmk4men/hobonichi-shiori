package app.hibinoshiori.diary;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Android 15 (SDK 35+) のデフォルトエッジ・ツー・エッジを無効化し、
        // 従来通りシステムバー領域を避けて描画する
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
