import {
  CalculatorIcon,
  MapIcon,
  TrendingIcon,
  ShieldIcon,
  UsersIcon,
  HomeIcon
} from '@/components/icons';

export const features = [
  { icon: CalculatorIcon, title: "AI-Powered Budget Analysis", description: "Our intelligent algorithm analyzes your income, expenses, and savings to calculate your true home buying budget with pinpoint accuracy." },
  { icon: MapIcon, title: "Interactive 3D Property Map", description: "Explore properties on an advanced mapping interface with real-time filters for price, location, amenities, and neighborhood data." },
  { icon: TrendingIcon, title: "Real-Time Market Analytics", description: "Access live pricing trends, historical data, and predictive insights powered by machine learning to make data-driven decisions." },
  { icon: ShieldIcon, title: "Comprehensive Financial Dashboard", description: "Visualize your complete financial health with automated affordability reports, debt-to-income ratios, and personalized recommendations." },
  { icon: UsersIcon, title: "Integrated Expert Network", description: "Connect directly with verified mortgage brokers, real estate agents, and financial advisors through our platform." },
  { icon: HomeIcon, title: "Automated Workflow Manager", description: "Track every milestone from pre-approval to closing with smart notifications, document management, and deadline tracking." },
];

export const steps = [
  { number: "01", icon: UsersIcon, title: "Connect Your Financial Data", description: "Securely link your accounts or manually input your financial information. Our platform analyzes your data in real-time." },
  { number: "02", icon: CalculatorIcon, title: "Get AI-Generated Insights", description: "Receive personalized affordability analysis, mortgage options, and budget recommendations based on your unique financial profile." },
  { number: "03", icon: MapIcon, title: "Explore Properties on Interactive Map", description: "Browse curated listings that match your criteria using our advanced 3D mapping technology with live market data overlays." },
  { number: "04", icon: HomeIcon, title: "Manage Your Journey End-to-End", description: "Track offers, manage documents, schedule viewings, and coordinate with experts—all from your centralized dashboard." },
];

export const problems = [
  { icon: "🔍", title: "Scattered Information", description: "Property data, mortgage calculators, and market insights are spread across dozens of websites, making it impossible to get a complete picture." },
  { icon: "📊", title: "Complex Financial Calculations", description: "Manual mortgage math, affordability estimates, and budget planning are error-prone and time-consuming without proper tools." },
  { icon: "❓", title: "Lack of Personalization", description: "Generic calculators don't account for your unique financial situation, family size, or long-term goals — leaving you with unreliable estimates." },
];
