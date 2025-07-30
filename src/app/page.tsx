import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BrainBased EMDR</h1>
                <p className="text-gray-600">Consultation Tracking Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Your EMDR
            <span className="text-blue-600"> Consultation Experience</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your EMDR consultation process with our integrated platform. 
            Track progress, manage sessions, and achieve certification with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/register">Start Your Journey</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for EMDR Consultation
            </h3>
            <p className="text-xl text-gray-600">
              Comprehensive tools designed specifically for EMDR practitioners and students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-blue-600 text-xl">📊</span>
                </div>
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>
                  Real-time progress monitoring with visual indicators and milestone celebrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Live hour calculation</li>
                  <li>• Milestone tracking</li>
                  <li>• Completion predictions</li>
                  <li>• Achievement badges</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-green-600 text-xl">🎥</span>
                </div>
                <CardTitle>Integrated Video Platform</CardTitle>
                <CardDescription>
                  Built-in video conferencing with recording and attendance tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• HD video quality</li>
                  <li>• Automatic recording</li>
                  <li>• Attendance verification</li>
                  <li>• Screen sharing</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-purple-600 text-xl">📅</span>
                </div>
                <CardTitle>Smart Scheduling</CardTitle>
                <CardDescription>
                  Intelligent scheduling with availability management and conflict resolution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Flexible availability</li>
                  <li>• Timezone support</li>
                  <li>• Conflict detection</li>
                  <li>• Auto-confirmation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Designed for Every User
            </h3>
            <p className="text-xl text-gray-600">
              Tailored experiences for students, consultants, and administrators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-2xl">👨‍🎓</span>
                </div>
                <CardTitle>Students</CardTitle>
                <CardDescription>
                  Complete your 40-hour consultation requirement efficiently
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-3">
                  <Badge variant="secondary">Progress Tracking</Badge>
                  <Badge variant="secondary">Session Booking</Badge>
                  <Badge variant="secondary">Document Upload</Badge>
                  <Badge variant="secondary">Auto-Certification</Badge>
                </div>
                <Button className="mt-6" asChild>
                  <Link href="/auth/register">Join as Student</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 text-2xl">👩‍⚕️</span>
                </div>
                <CardTitle>Consultants</CardTitle>
                <CardDescription>
                  Manage your consultation practice with powerful tools
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-3">
                  <Badge variant="secondary">Availability Management</Badge>
                  <Badge variant="secondary">Session Verification</Badge>
                  <Badge variant="secondary">Payment Tracking</Badge>
                  <Badge variant="secondary">Performance Analytics</Badge>
                </div>
                <Button className="mt-6" asChild>
                  <Link href="/auth/register">Join as Consultant</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 text-2xl">⚙️</span>
                </div>
                <CardTitle>Administrators</CardTitle>
                <CardDescription>
                  Oversee the entire consultation program with comprehensive tools
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-3">
                  <Badge variant="secondary">User Management</Badge>
                  <Badge variant="secondary">System Monitoring</Badge>
                  <Badge variant="secondary">Analytics Dashboard</Badge>
                  <Badge variant="secondary">Quality Assurance</Badge>
                </div>
                <Button className="mt-6" asChild>
                  <Link href="/auth/register">Join as Admin</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your EMDR Experience?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of EMDR practitioners and students who have streamlined their consultation process
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">Get Started Today</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">B</span>
                </div>
                <span className="font-bold text-lg">BrainBased EMDR</span>
              </div>
              <p className="text-gray-400">
                Transforming EMDR consultation through technology and innovation.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth/login" className="hover:text-white">Sign In</Link></li>
                <li><Link href="/auth/register" className="hover:text-white">Register</Link></li>
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:support@brainbasedemdr.com" className="hover:text-white">Contact Support</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">HIPAA Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BrainBased EMDR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
