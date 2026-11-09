import { useEffect, useRef, useState, useCallback } from 'react';
import { BackHandler, Linking, Platform, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import * as SplashScreen from 'expo-splash-screen';
import { PHOTOS } from './photos';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Bump when the bundled web app changes, so the copy on the phone is refreshed.
const CONTENT_VERSION = '1';

async function copyAsset(mod, dest) {
  const a = Asset.fromModule(mod);
  await a.downloadAsync();
  if (dest.exists) dest.delete();
  await new File(a.localUri).copy(dest);
}

// The app is a single offline web page plus photo sheets. Copy them into the
// app's own storage once, then open the page from there.
async function prepareContent() {
  const root = new Directory(Paths.document, 'wfd');
  const ph = new Directory(root, 'ph');
  const marker = new File(root, 'version.txt');
  const index = new File(root, 'index.html');
  if (marker.exists && index.exists && marker.textSync() === CONTENT_VERSION) return { root, index };
  root.create({ idempotent: true, intermediates: true });
  ph.create({ idempotent: true, intermediates: true });
  await copyAsset(require('./assets/web/index.html'), index);
  for (let i = 0; i < PHOTOS.length; i++) await copyAsset(PHOTOS[i], new File(ph, `s${i}.jpg`));
  if (!marker.exists) marker.create();
  marker.writeSync(CONTENT_VERSION);
  return { root, index };
}

export default function App() {
  const web = useRef(null);
  const canGoBack = useRef(false);
  const [paths, setPaths] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    prepareContent().then(setPaths).catch(e => setError(String(e)));
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack.current && web.current) { web.current.goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, []);

  // Links to WhatsApp, YouTube, email, social sites etc. open in their own apps.
  const onLink = useCallback(req => {
    const url = req.url || '';
    if (url.startsWith('file:') || url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:')) return true;
    if (!req.isTopFrame && /^https?:/.test(url)) return true;
    Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  if (error) {
    return <View style={s.center}><Text style={s.err}>تعذّر فتح التطبيق. أعد تشغيله.{'\n'}{error}</Text></View>;
  }
  if (!paths) {
    return <View style={s.center}><ActivityIndicator color="#a8323e" /></View>;
  }
  return (
    <View style={s.wrap}>
      <StatusBar style="dark" />
      <WebView
        ref={web}
        style={s.wrap}
        source={{ uri: paths.index.uri }}
        originWhitelist={['*']}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        allowingReadAccessToURL={paths.root.uri}
        domStorageEnabled
        javaScriptEnabled
        setSupportMultipleWindows={false}
        applicationNameForUserAgent="WhatsForDinnerApp/1.0"
        onShouldStartLoadWithRequest={onLink}
        onNavigationStateChange={n => { canGoBack.current = n.canGoBack; }}
        onLoadEnd={() => SplashScreen.hideAsync().catch(() => {})}
        mediaPlaybackRequiresUserAction={false}
        bounces={false}
        overScrollMode="never"
        textZoom={100}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f3f5ef' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f5ef', padding: 24 },
  err: { color: '#a8323e', textAlign: 'center', fontSize: 16 },
});
