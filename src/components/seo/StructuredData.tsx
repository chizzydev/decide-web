interface StructuredDataProps {
  data: Record<string, unknown> | Record<string, unknown>[]
}

export const StructuredData = ({ data }: StructuredDataProps) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
)
