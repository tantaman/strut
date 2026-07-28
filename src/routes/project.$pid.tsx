import { createFileRoute } from '@tanstack/react-router'
import { preloadProjectDecks } from '../rindle/appSsr'
import { DashboardView } from './index'

export const Route = createFileRoute('/project/$pid')({
  loader: ({ params }) => preloadProjectDecks({ data: { pid: params.pid } }),
  component: ProjectDashboard,
})

function ProjectDashboard() {
  const { pid } = Route.useParams()
  return <DashboardView loaderData={Route.useLoaderData()} pid={pid} />
}
