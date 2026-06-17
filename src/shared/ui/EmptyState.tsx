type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="empty-state" aria-label={title}>
      <div className="empty-state__mark" aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  )
}
