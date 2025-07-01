declare module 'react-native-youtube-iframe' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';

  interface YoutubePlayerProps {
    height: number;
    play?: boolean;
    videoId: string;
    webViewProps?: {
      style?: ViewStyle;
      androidLayerType?: 'hardware' | 'software';
    };
    initialPlayerParams?: {
      preventFullScreen?: boolean;
      cc_lang_pref?: string;
      showClosedCaptions?: boolean;
      controls?: number;
      modestbranding?: number;
      rel?: number;
      showinfo?: number;
      iv_load_policy?: number;
    };
    onError?: (error: any) => void;
    onReady?: () => void;
    onStateChange?: (state: string) => void;
    onPlaybackQualityChange?: (quality: string) => void;
    onPlaybackRateChange?: (rate: number) => void;
  }

  export default class YoutubePlayer extends Component<YoutubePlayerProps> {}
}
