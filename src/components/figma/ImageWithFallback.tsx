import React, { useState, useEffect } from 'react'
import { getMediaUrl } from '../../utils/mediaCache'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** 이 src가 로딩 실패하면 이 폴백 이미지를 대신 보여줌 */
  fallbackSrc?: string;
}

export function ImageWithFallback({ fallbackSrc, ...props }: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false)
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(props.src)

  // Supabase Storage URL인 경우 캐시된 blob URL로 교체
  useEffect(() => {
    let cancelled = false

    if (!props.src) {
      setResolvedSrc(undefined)
      return
    }

    // 로컬 경로나 data: URL은 그대로 사용
    if (!props.src.startsWith('http') || !props.src.includes('supabase.co/storage')) {
      setResolvedSrc(props.src)
      return
    }

    // 캐시에서 blob URL 가져오기
    getMediaUrl(props.src).then(url => {
      if (!cancelled) {
        setResolvedSrc(url)
      }
    }).catch(() => {
      if (!cancelled) {
        setResolvedSrc(props.src) // 폴백: 원래 URL 사용
      }
    })

    return () => { cancelled = true }
  }, [props.src])

  const handleError = () => {
    setDidError(true)
  }

  // src가 비어있으면 fallbackSrc가 있으면 그것을 사용, 없으면 에러 placeholder
  if (!props.src) {
    if (fallbackSrc) {
      const { alt, style, className, ...rest } = props
      return <img src={fallbackSrc} alt={alt} className={className} style={style} {...rest} />
    }
    return null
  }

  const { src, alt, style, className, ...rest } = props

  // 에러 발생 시: fallbackSrc가 있으면 그것을 사용, 없으면 기본 에러 placeholder
  if (didError) {
    if (fallbackSrc) {
      return <img src={fallbackSrc} alt={alt} className={className} style={style} {...rest} />
    }
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
        </div>
      </div>
    )
  }

  return <img src={resolvedSrc} alt={alt} className={className} style={style} {...rest} onError={handleError} />
}
