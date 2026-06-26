import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import App from './App'

describe('App shell', () => {
  it('renders the SURF CRM navigation and dashboard route', async () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    expect(screen.getByText('SURF CRM')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Questionnaire/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Waitlist/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Feedback/i })).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /Actions du jour/i }),
    ).toBeInTheDocument()
  })

  it('renders the prospects table route', async () => {
    window.history.pushState({}, '', '/prospects')
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /Prospects/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Coralie Ramakavelo')).toBeInTheDocument()
  })

  it('renders a prospect detail route with linked history and edit controls', async () => {
    window.history.pushState({}, '', '/prospects/P008')
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /Coralie Ramakavelo/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Messages')).toBeInTheDocument()
    expect(screen.getByLabelText('Statut')).toBeInTheDocument()
    expect(screen.getByLabelText('Prochaine action')).toBeInTheDocument()
  })

  it('renders relances and marks one as done', async () => {
    const user = userEvent.setup()

    window.history.pushState({}, '', '/relances')
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /Relances/i }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /En retard/i }),
    ).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /Marquer fait/i })[0])

    expect(await screen.findByText('2026-06-16 - Fait')).toBeInTheDocument()
  })

  it('renders outbound pool and marks a target as analyzed', async () => {
    const user = userEvent.setup()

    window.history.pushState({}, '', '/outbound')
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /Outbound pool/i }),
    ).toBeInTheDocument()

    // Le nom peut apparaître dans le focus-block ET dans le tableau — on cible
    // explicitement le lien qui se trouve dans une ligne de tableau (<tr>).
    const allTahiryLinks = await screen.findAllByRole('link', {
      name: 'Tahiry RASAMOELISON',
    })
    const tahiryLink = allTahiryLinks.find((el) => el.closest('tr')) ?? allTahiryLinks[0]
    const tahiryRow = tahiryLink.closest('tr')

    expect(tahiryRow).not.toBeNull()

    await user.click(screen.getByRole('button', { name: /Cibler la prochaine/i }))
    await user.click(
      within(tahiryRow as HTMLElement).getByRole('button', {
        name: /Marquer analysee/i,
      }),
    )

    expect(await within(tahiryRow as HTMLElement).findByText('analyzed')).toBeInTheDocument()
  })

  it('renders insights and marks a learning as used in a post', async () => {
    const user = userEvent.setup()

    window.history.pushState({}, '', '/insights')
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /Insights et lead magnets/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText(/Un site en reconstruction/i)).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /Marquer utilise/i })[0])

    expect(await screen.findByText('Deja utilise')).toBeInTheDocument()
  })

  it('renders weekly reviews route', async () => {
    window.history.pushState({}, '', '/bilans')
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /Bilans hebdomadaires/i }),
    ).toBeInTheDocument()
    expect((await screen.findAllByText('2026-W25')).length).toBeGreaterThan(0)
    expect(await screen.findByText(/Relancer Coralie sur le pilote/i)).toBeInTheDocument()
  })

  it.each([
    ['/questionnaire', 'Questionnaire', 'Xavier N.'],
    ['/waitlist', 'Waitlist', 'Iary R.'],
    ['/feedback', 'Feedback', 'Beta tester 1'],
  ])('renders the %s raw Sheet route', async (route, heading, expectedValue) => {
    window.history.pushState({}, '', route)
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: heading }),
    ).toBeInTheDocument()
    expect(await screen.findByText(expectedValue)).toBeInTheDocument()
  })

  it('renders CRM quality control route', async () => {
    window.history.pushState({}, '', '/quality')
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /Qualité CRM/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText(/Checks structurants/i)).toBeInTheDocument()
  })
})
