import { useCallback, useRef } from 'react'

interface ClaimCertificateParams {
  certUrl: string
  email?: string
  phone?: string
  reference?: string
  vendor?: string
}

interface ComplianceData {
  certId: string
  certUrl: string
  claimedAt: string
  outcome: string
  isCompliant: boolean
  browser?: string
  operatingSystem?: string
  expiresAt?: string
  warnings?: string[]
  scanResults?: {
    requiredFound: string[]
    requiredNotFound: string[]
    forbiddenFound: string[]
  }
}

export const useTrustedForm = () => {
  const certRef = useRef<string | null>(null)

  const claimCertificate = useCallback(
    async (params: ClaimCertificateParams): Promise<ComplianceData> => {
      try {
        const response = await fetch('/api/trustedform/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to claim certificate')
        }

        const data: ComplianceData = await response.json()
        certRef.current = data.certId

        // Store in session for dashboard
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tf_cert_id', data.certId)
          sessionStorage.setItem('tf_compliance', JSON.stringify(data))
        }

        return data
      } catch (error) {
        console.error('[v0] TrustedForm claim failed:', error)
        throw error
      }
    },
    []
  )

  const getCertificateUrl = useCallback(() => {
    return certRef.current ? `https://cert.trustedform.com/${certRef.current}` : null
  }, [])

  const getCertId = useCallback(() => {
    if (typeof window !== 'undefined') {
      return (window as any).tf_cert_id || certRef.current
    }
    return certRef.current
  }, [])

  return {
    claimCertificate,
    getCertificateUrl,
    getCertId,
  }
}

// Helper to inject TrustedForm form ID
export const injectTrustedFormId = (formId: string) => {
  if (typeof window !== 'undefined') {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.text = `tf_form_id = '${formId}';`
    document.head.appendChild(script)
  }
}

// Helper to get cert ID after form submission
export const getTrustedFormCertId = (): string | null => {
  if (typeof window !== 'undefined') {
    return (window as any).tf_cert_id || null
  }
  return null
}
