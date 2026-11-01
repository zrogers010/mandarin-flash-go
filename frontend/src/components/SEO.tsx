import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  canonical?: string
  type?: 'website' | 'article'
  noindex?: boolean
}

const SITE_NAME = 'MandarinFlash'
const SITE_URL = 'https://mandarinflash.com'
const DEFAULT_DESCRIPTION = 'Free Mandarin Chinese learning platform with interactive flashcards, HSK vocabulary, pinyin chart, grammar lessons, AI tutor, and more.'
const OG_IMAGE = `${SITE_URL}/og-image.png`

export function SEO({ title, description, canonical, type = 'website', noindex = false }: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Learn Mandarin Chinese`
  const desc = description || DEFAULT_DESCRIPTION
  const url = canonical || SITE_URL

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@mandarinflash" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Helmet>
  )
}
