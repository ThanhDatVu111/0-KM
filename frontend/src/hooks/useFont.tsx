import { useEffect, useState } from 'react';
import * as Font from 'expo-font';

const useFont = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
        'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
        'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
        'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
        'PixelifySans': require('../assets/fonts/PixelifySans.ttf'),
        'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
        'PressStart2P': require('../assets/fonts/PressStart2P-Regular.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []); //when component mounts, load fonts
  return fontsLoaded;
};

export default useFont;
