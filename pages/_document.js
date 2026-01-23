import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html data-theme="dark">
            <Head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var t=localStorage.getItem('theme');var theme=(t==='light'||t==='dark')?t:null;if(!theme){theme=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=theme;}catch(e){}})();`,
                    }}
                />
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/css/bootstrap.min.css"
                    integrity="sha384-0evHe/X+R7YkIZDRvuzKMRqM+OrBnVFBL6DOitfPri4tjfHxaWutUpFmBp4vmVor"
                    crossOrigin="anonymous"
                />
                <link rel="stylesheet" href="/spritesheets/_minecraft.css" />
                <link rel="stylesheet" href="/spritesheets/_itemsheet.css" />
                <link rel="stylesheet" href="/spritesheets/_charmsheet.css" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}