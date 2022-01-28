import "../styles/globals.css";
import Script from "next/script";
import type { AppProps } from "next/app";

import dynamic from "next/dynamic";
const WalletProviderSection = dynamic(
  () => import("../components/WalletProviderSection"),
  {
    ssr: false,
  }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* <Script
        id="GoogleAnalyticsTag"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
      />

      <Script id="GoogleAnalyticsConfig" strategy="lazyOnload">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
        `}
      </Script> */}
      <WalletProviderSection>
        <Component {...pageProps} />
      </WalletProviderSection>
    </>
  );
}

export default MyApp;
