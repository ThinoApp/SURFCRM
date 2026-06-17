type PageHeaderProps = {
  eyebrow: string
  title: string
  description: string
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  )
}
