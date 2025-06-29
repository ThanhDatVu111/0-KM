// components/MapPickerWebView.tsx
import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, ImageBackground, Image } from 'react-native';
import { WebView } from 'react-native-webview';

// Import your assets (adjust the path as needed)
import images from '@/constants/images';
import icons from '@/constants/icons';

// Use a plain template string for leafletHTML
// language=HTML
const leafletHTML =`
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin:0; padding:0; }
    #map { width:100vw; height:100vh; }
    body {
      background: linear-gradient(135deg, #fad3e4 0%, #e1d9ff 100%);
    }
    #search-bar {
      position: absolute; top: 80px; left: 32px; right: 32px;
      background: #FFF8C6;
      border: 2px solid #000;
      box-shadow: 4px 4px 0 #000;
      padding: 2px 8px; z-index:1100;
      display: flex;
      align-items: center;
      max-width: 320px;
      margin: 0 auto;
      border-radius: 8px;
    }
    #search-input {
      width: 100%; border: none; outline: none;
      font-family: monospace; font-size: 14px;
      background: transparent;
      padding: 4px 0;
    }
    #search-input:focus {
      outline: none;
      box-shadow: none;
      border: none;
      background: transparent;
      /* Remove any zoom or highlight effect on focus */
      font-size: 14px;
      /* Prevent iOS Safari zoom on input focus */
      font-size: 16px;
    }
    #search-results {
      position:absolute; top:92px; left:32px; right:32px;
      background: #D0F5FF;
      border: 2px solid #000;
      box-shadow: 4px 4px 0 #000; max-height:150px; overflow-y:auto;
      font-family: monospace; font-size:14px; z-index:1200;
      max-width: 320px;
      margin: 0 auto;
      border-radius: 0 0 8px 8px;
    }
    .search-result {
      padding:6px 10px; cursor:pointer; border-bottom:1px solid #000;
      background: #fff;
    }
    .search-result:hover {
      background: #ffe4e1;
    }
    .search-result:last-child { border-bottom:none; }
    #locate-btn { display: none; }
    .leaflet-control-zoom {
      display: none !important;
    }
    .leaflet-top, .leaflet-bottom {
      top: auto;
      bottom: 32px;
    }
  </style>
</head>
<body>
  <div id="search-bar">
    <input id="search-input" placeholder="Search for a place…" autocomplete="off" />
  </div>
  <div id="search-results" style="display:none;"></div>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    let selectedPlace = null;
    // === Map Setup ===
    const map = L.map('map', { zoomControl: true }).setView([37.78, -122.43], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);
    let selectMarker = null;
    // Helper: reverse geocode
    function reverseGeocode(lat, lng, cb) {
      fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${lat}&lon=\${lng}\`)
        .then(r => r.json())
        .then(data => cb(data.display_name || \`\${lat.toFixed(5)}, \${lng.toFixed(5)}\`))
        .catch(() => cb(\`\${lat.toFixed(5)}, \${lng.toFixed(5)}\`));
    }
    // === Map Click Handler ===
    map.on('click', e => {
      if (selectMarker) map.removeLayer(selectMarker);
      selectMarker = L.marker(e.latlng).addTo(map);
      reverseGeocode(e.latlng.lat, e.latlng.lng, function(address) {
        document.getElementById('search-input').value = address;
        selectedPlace = { lat: e.latlng.lat, lng: e.latlng.lng, name: address };
        window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng, name: address }));
      });
    });
    // === Search Bar Logic ===
    const input = document.getElementById('search-input');
    const resultsDiv = document.getElementById('search-results');
    let timeout = null;
    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (timeout) clearTimeout(timeout);
      if (!q) {
        resultsDiv.style.display = 'none';
        return;
      }
      timeout = setTimeout(() => {
        fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(q))
          .then(r => r.json())
          .then(items => {
            resultsDiv.innerHTML = '';
            if (!items.length) {
              resultsDiv.style.display = 'none';
              return;
            }
            items.forEach(place => {
              const div = document.createElement('div');
              div.className = 'search-result';
              div.textContent = place.display_name;
              div.onclick = () => {
                map.setView([place.lat, place.lon], 16);
                if (selectMarker) map.removeLayer(selectMarker);
                selectMarker = L.marker([place.lat, place.lon]).addTo(map);
                input.value = place.display_name;
                selectedPlace = { lat: parseFloat(place.lat), lng: parseFloat(place.lon), name: place.display_name };
                window.ReactNativeWebView.postMessage(JSON.stringify({ lat: parseFloat(place.lat), lng: parseFloat(place.lon), name: place.display_name }));
                resultsDiv.style.display = 'none';
              };
              resultsDiv.appendChild(div);
            });
            resultsDiv.style.display = 'block';
          });
      }, 400);
    });
    document.body.addEventListener('click', e => {
      if (!resultsDiv.contains(e.target) && e.target !== input) {
        resultsDiv.style.display = 'none';
      }
    });
    // Enable pinch zoom and drag
    map.scrollWheelZoom.enable();
    map.touchZoom.enable();
    map.dragging.enable();
    map.doubleClickZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
  </script>
</body>
</html>
`;

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, name: string) => void;
};

export default function MapPickerWebView({ visible, onClose, onSelect }: Props) {
  const [selected, setSelected] = useState<{ lat: number; lng: number; name?: string } | null>(
    null,
  );
  return (
    <Modal visible={visible} animationType="slide">
      <ImageBackground source={images.navBarBackground} style={{ flex: 1 }} resizeMode="cover">
        <WebView
          originWhitelist={['*']}
          source={{ html: leafletHTML }}
          style={styles.webview}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              setSelected(data);
            } catch {}
          }}
        />
        <View style={styles.footerContainer}>
          <ImageBackground
            source={images.navBarBackground}
            resizeMode="stretch"
            style={styles.footerBg}
            imageStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          >
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  if (selected) {
                    onSelect(selected.lat, selected.lng, selected.name || '');
                    onClose();
                  }
                }}
              >
                <Image source={icons.location2} style={styles.icon} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, !selected && { opacity: 0.5 }]}
                onPress={onClose}
              >
                <Image source={icons.deleteIcon} style={styles.icon} />
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  footerContainer: {
    width: '100%',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  footerBg: {
    width: '100%',
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingVertical: 8,
  },
  iconButton: {
    backgroundColor: '#E1D9FF',
    borderWidth: 3,
    borderColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
});
