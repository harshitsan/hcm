/**
 * Role-aware Home (ux-research §6): one route, five compositions.
 * Queue for managers, numbers for employees, health for operators,
 * cross-company digest for portfolio, rule-confidence for HR admins.
 */
import { useApp } from '../store'
import HomeEmployee from './home/HomeEmployee'
import HomeManager from './home/HomeManager'
import HomeAdmin from './home/HomeAdmin'
import HomePortfolio from './home/HomePortfolio'
import HomeOperator from './home/HomeOperator'

export default function Home() {
  const { persona } = useApp()
  switch (persona.id) {
    case 'manager':
      return <HomeManager />
    case 'hradmin':
      return <HomeAdmin />
    case 'portfolio':
      return <HomePortfolio />
    case 'operator':
      return <HomeOperator />
    default:
      return <HomeEmployee />
  }
}
