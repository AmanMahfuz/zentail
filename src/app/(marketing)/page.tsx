"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Play, ArrowRight, BarChart3, FileText, CheckCircle2, LayoutDashboard, Search, Users, FileBarChart, Zap, FileSpreadsheet, FileQuestion, LineChart } from "lucide-react"
import { motion } from "framer-motion"

// Animation variants
const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

const staggerContainer: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
}

const scaleIn: any = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
      {/* Header - Glassmorphism */}
      <header className="px-6 lg:px-12 h-20 flex items-center sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm">
        <Link href="/" className="flex items-center justify-center gap-2 group">
          <div className="bg-blue-600 rounded p-1.5 shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Zentail</span>
        </Link>
        <nav className="hidden md:flex ml-auto items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
            Pricing
          </Link>
          <Link href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
            Testimonials
          </Link>
        </nav>
        <div className="flex items-center gap-4 ml-auto md:ml-8">
          <Link href="/signin">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">Log In</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-md shadow-blue-500/20 transition-all hover:shadow-blue-500/40 hover:-translate-y-0.5">
              Sign up
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 lg:py-32 relative overflow-hidden bg-white">
          {/* Decorative Background Gradients */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-50/50 blur-3xl opacity-70"></div>
          </div>

          <div className="container mx-auto px-6 lg:px-12 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
              
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="flex flex-col space-y-8 max-w-xl"
              >
                <motion.div variants={fadeUp} className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50/50 backdrop-blur-sm px-4 py-1.5 text-sm text-blue-700 font-medium w-max shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-ping" style={{ animationDuration: '3s' }}></span>
                  <span className="absolute flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
                  The #1 Platform for Students
                </motion.div>
                
                <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
                  Master Your <br className="hidden sm:block" />
                  <span className="relative inline-block mt-2">
                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Job Search</span>
                    <svg className="absolute w-full h-4 -bottom-1 left-0 text-blue-400/40 z-0" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                    </svg>
                  </span>
                </motion.h1>
                
                <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-600 leading-relaxed font-light">
                  Turn the chaos of applying into a strategic advantage. Track applications, manage resumes, and crush interviews with organized precision.
                </motion.p>
                
                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/signup">
                    <Button size="lg" className="w-full sm:w-auto font-semibold h-14 px-8 bg-blue-600 hover:bg-blue-700 rounded-full text-base shadow-xl shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:-translate-y-1">
                      Start Tracking for Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-full text-base border-slate-200 hover:bg-slate-50 text-slate-700 transition-all hover:border-slate-300">
                      <Play className="mr-2 h-5 w-5 text-blue-500 fill-blue-500/20" /> See How it Works
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
              
              {/* Hero Graphic - Kanban Board Mockup */}
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={scaleIn}
                className="relative mx-auto w-full max-w-lg lg:max-w-none perspective-1000"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 rounded-3xl blur-3xl transform rotate-3 scale-105"></div>
                
                <div className="relative bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-2xl p-4 sm:p-6 overflow-hidden transform hover:-translate-y-2 transition-transform duration-500 ease-out">
                  {/* Browser Dots */}
                  <div className="flex gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-400/90 shadow-sm shadow-red-400/50"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400/90 shadow-sm shadow-amber-400/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/90 shadow-sm shadow-green-400/50"></div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {/* Column 1: Applied */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-semibold text-sm text-slate-700">Applied</span>
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">12</span>
                      </div>
                      
                      {/* Card 1 */}
                      <motion.div whileHover={{ scale: 1.02 }} className="bg-white border border-slate-200/60 p-3 rounded-xl shadow-sm cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                          <span className="text-blue-600 font-bold text-xs">S</span>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-800">Software Engineer</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">TechCorp Inc.</p>
                        <div className="flex items-center mt-3 text-[10px] text-blue-600 font-semibold bg-blue-50 w-max px-2 py-1 rounded-md">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> ATS Matched
                        </div>
                      </motion.div>
                      
                      {/* Card 2 */}
                      <motion.div whileHover={{ scale: 1.02 }} className="bg-white border border-slate-200/60 p-3 rounded-xl shadow-sm cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                          <span className="text-purple-600 font-bold text-xs">D</span>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-800">Data Analyst</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Build Co.</p>
                      </motion.div>
                    </div>

                    {/* Column 2: Interviewing */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-semibold text-sm text-slate-700">Interviewing</span>
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">2</span>
                      </div>
                      
                      {/* Card 3 */}
                      <motion.div whileHover={{ scale: 1.02 }} className="bg-blue-50/50 border border-blue-200 p-3 rounded-xl shadow-sm relative cursor-pointer">
                        <div className="absolute top-3 right-3 bg-red-100 text-red-600 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Urgent</div>
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center mb-3 shadow-sm">
                          <span className="text-indigo-600 font-bold text-xs">UX</span>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-800">UX Designer</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Pixel Agency</p>
                      </motion.div>
                    </div>

                    {/* Column 3: Offer */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-semibold text-sm text-slate-700">Offer</span>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">1</span>
                      </div>
                      
                      {/* Card 4 */}
                      <motion.div whileHover={{ scale: 1.02 }} className="bg-white border border-green-200 p-3 rounded-xl shadow-md shadow-green-100 relative overflow-hidden cursor-pointer">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                          <span className="text-green-600 font-bold text-xs">F</span>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-800">Frontend Dev</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Startup Inc.</p>
                        <div className="flex items-center mt-3 text-[10px] text-green-700 font-bold bg-green-50 w-max px-2 py-1 rounded-md">
                          <Zap className="w-3 h-3 mr-1 fill-green-500" /> $120k/year
                        </div>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Floating Notification */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.5, type: "spring" }}
                    className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 z-20"
                  >
                    <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-2.5 rounded-full shadow-inner">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Interview Rate</p>
                      <p className="font-extrabold text-lg text-slate-800">28% <span className="text-emerald-500 text-xs font-semibold ml-1">↑ 12%</span></p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="w-full py-24 bg-slate-50 relative border-t border-slate-100">
          <div className="container mx-auto px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              className="text-center max-w-2xl mx-auto mb-16 space-y-4"
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
                Applying to 100+ jobs shouldn't be chaotic.
              </h2>
              <p className="text-slate-500 text-lg font-light">
                Spreadsheets are messy, bookmarks get lost, and ghosting leaves you guessing. It's time for a system built for modern job seekers.
              </p>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {[
                { icon: FileSpreadsheet, title: "Spreadsheet Hell", desc: "Manually updating rows and columns is tedious and error-prone.", color: "red" },
                { icon: FileQuestion, title: "Lost Resumes", desc: "Forgetting which version of your resume you sent to which company.", color: "amber" },
                { icon: LineChart, title: "Zero Insights", desc: "Getting rejected without understanding why or how to improve.", color: "slate" }
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} whileHover={{ y: -5 }} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 border border-slate-100 text-center flex flex-col items-center group">
                  <div className={`w-14 h-14 bg-${item.color}-50 text-${item.color}-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-light">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-32 bg-white relative">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
          
          <div className="container mx-auto px-6 relative z-10">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="mb-20 space-y-4 max-w-3xl"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                Everything you need to <span className="text-blue-600">land the offer.</span>
              </h2>
              <p className="text-slate-500 text-xl font-light">
                A comprehensive native toolkit designed specifically for students and new graduates navigating the modern job market.
              </p>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Feature 1 (Spans 2 cols on lg) */}
              <motion.div variants={fadeUp} className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 shadow-sm hover:shadow-lg transition-shadow p-10 rounded-3xl overflow-hidden relative group">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800">Visual Application Board</h3>
                <p className="text-slate-500 text-base mb-10 max-w-md font-light">
                  Drag and drop applications across custom stages. Always know where you stand with every company.
                </p>
                <div className="flex gap-4 mt-auto group-hover:translate-y-2 transition-transform duration-500 ease-out">
                  <div className="w-1/3 h-32 bg-white border border-slate-200 rounded-xl shadow-sm p-3">
                    <div className="h-3 w-1/2 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-12 w-full bg-slate-50 border border-slate-100 rounded-lg"></div>
                  </div>
                  <div className="w-1/3 h-32 bg-white border border-blue-200 rounded-xl shadow-md shadow-blue-100 p-3 relative -translate-y-4">
                     <div className="h-3 w-1/2 bg-blue-200 rounded-full mb-4"></div>
                     <div className="h-12 w-full bg-blue-50 border border-blue-100 rounded-lg"></div>
                  </div>
                  <div className="w-1/3 h-32 bg-white border border-slate-200 rounded-xl shadow-sm p-3 opacity-50">
                     <div className="h-3 w-1/2 bg-slate-200 rounded-full mb-4"></div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div variants={fadeUp} className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 shadow-sm hover:shadow-lg transition-shadow p-10 rounded-3xl group">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800">Resume Manager</h3>
                <p className="text-slate-500 text-base mb-10 font-light">
                  Link specific resume versions to individual job applications automatically.
                </p>
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center shadow-sm group-hover:border-emerald-200 transition-colors">
                    <FileText className="w-5 h-5 text-slate-400 mr-3" />
                    <span className="text-sm font-semibold text-slate-700">Software_Eng_v2.pdf</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center shadow-sm opacity-50">
                    <FileText className="w-5 h-5 text-slate-400 mr-3" />
                    <span className="text-sm font-medium text-slate-600">Data_Analyst_Final.pdf</span>
                  </div>
                </div>
              </motion.div>

              {/* Feature 3 (Dark Mode Card) */}
              <motion.div variants={fadeUp} className="bg-slate-900 text-white p-10 rounded-3xl relative overflow-hidden group shadow-2xl shadow-slate-900/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700"></div>
                <div className="w-12 h-12 bg-slate-800 text-blue-400 rounded-xl flex items-center justify-center mb-6 border border-slate-700 shadow-inner">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3 relative z-10">Rejection Analytics</h3>
                <p className="text-slate-400 text-base mb-10 relative z-10 font-light">
                  Turn "no" into data. Identify bottlenecks in your pipeline.
                </p>
                {/* Abstract Bar Chart */}
                <div className="absolute bottom-0 left-0 w-full h-32 flex items-end justify-around px-8 opacity-90 group-hover:h-36 transition-all duration-500">
                  <div className="w-1/4 h-16 bg-slate-800 rounded-t-md"></div>
                  <div className="w-1/4 h-28 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md shadow-[0_0_20px_rgba(59,130,246,0.6)] relative overflow-hidden">
                     <div className="absolute top-0 w-full h-1 bg-blue-300"></div>
                  </div>
                  <div className="w-1/4 h-10 bg-slate-800 rounded-t-md"></div>
                </div>
              </motion.div>

              {/* Feature 4 */}
              <motion.div variants={fadeUp} className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 shadow-sm hover:shadow-lg transition-shadow p-10 rounded-3xl group">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                  <Zap className="w-6 h-6 fill-amber-500 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800">Interview Prep</h3>
                <p className="text-slate-500 text-base mb-10 font-light">
                  Built-in flashcards and company-specific question banks.
                </p>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm group-hover:-translate-y-1 transition-transform">
                  <p className="text-sm font-semibold text-slate-800 mb-2">"Describe a time you failed."</p>
                  <Button variant="ghost" className="text-blue-600 text-xs h-auto p-2 font-bold hover:bg-blue-50 w-full rounded-xl">Tap to Reveal Answer</Button>
                </div>
              </motion.div>

              {/* Feature 5 */}
              <motion.div variants={fadeUp} className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 shadow-sm hover:shadow-lg transition-shadow p-10 rounded-3xl group">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-800">Networking CRM</h3>
                <p className="text-slate-500 text-base mb-10 font-light">
                  Track referrals and connect them directly to job postings.
                </p>
                <div className="space-y-3">
                   <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm group-hover:border-indigo-200 transition-colors">
                     <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-100 rounded-full flex items-center justify-center text-sm font-extrabold text-slate-600 shadow-inner">JD</div>
                     <div>
                       <p className="text-sm font-bold text-slate-800">Jane Doe</p>
                       <p className="text-[11px] text-slate-500 font-medium">Referral for Google</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm opacity-50">
                     <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-extrabold text-slate-600">MS</div>
                     <div>
                       <p className="text-sm font-bold text-slate-800">Mike Smith</p>
                       <p className="text-[11px] text-slate-500 font-medium">Met at Career Fair</p>
                     </div>
                   </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-32 bg-slate-50 border-t border-slate-100">
          <div className="container mx-auto px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              className="text-center max-w-2xl mx-auto mb-20 space-y-4"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                Simple, transparent pricing.
              </h2>
              <p className="text-slate-500 text-xl font-light">
                Invest in your career with a tool that pays for itself with your first paycheck.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
              {/* Basic Plan */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300"
              >
                <h3 className="text-3xl font-bold text-slate-900 mb-2">Basic</h3>
                <p className="text-slate-500 text-base mb-8 font-light">For active searchers getting started.</p>
                <div className="mb-10 flex items-baseline gap-2">
                  <span className="text-6xl font-black text-slate-900 tracking-tighter">₹199</span>
                  <span className="text-slate-500 font-medium">/month</span>
                </div>
                <ul className="space-y-5 mb-10">
                  <li className="flex items-center text-base text-slate-700 font-medium">
                    <CheckCircle2 className="w-6 h-6 text-blue-600 mr-3 shrink-0" /> Up to 50 active applications
                  </li>
                  <li className="flex items-center text-base text-slate-700 font-medium">
                    <CheckCircle2 className="w-6 h-6 text-blue-600 mr-3 shrink-0" /> Basic visual board
                  </li>
                  <li className="flex items-center text-base text-slate-700 font-medium">
                    <CheckCircle2 className="w-6 h-6 text-blue-600 mr-3 shrink-0" /> Manage up to 3 resume versions
                  </li>
                </ul>
                <Button variant="outline" className="w-full py-7 rounded-2xl border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-lg transition-colors">
                  Get Started Free
                </Button>
              </motion.div>

              {/* Pro Plan */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gradient-to-b from-blue-600 to-blue-800 rounded-[2rem] p-10 border border-blue-500 shadow-2xl shadow-blue-900/20 relative md:scale-105 z-10"
              >
                <div className="absolute top-0 right-10 transform -translate-y-1/2 shadow-lg rounded-full">
                  <span className="bg-gradient-to-r from-emerald-400 to-green-500 text-green-950 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-inner">Most Popular</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Pro</h3>
                <p className="text-blue-200 text-base mb-8 font-light">For heavy applicants needing insights.</p>
                <div className="mb-10 flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white tracking-tighter drop-shadow-sm">₹499</span>
                  <span className="text-blue-200 font-medium">/month</span>
                </div>
                <ul className="space-y-5 mb-10">
                  <li className="flex items-center text-base text-white font-medium">
                    <CheckCircle2 className="w-6 h-6 text-blue-300 mr-3 shrink-0" /> Unlimited applications
                  </li>
                  <li className="flex items-center text-base text-white font-medium">
                    <CheckCircle2 className="w-6 h-6 text-blue-300 mr-3 shrink-0" /> Advanced rejection analytics
                  </li>
                  <li className="flex items-center text-base text-white font-medium">
                    <CheckCircle2 className="w-6 h-6 text-blue-300 mr-3 shrink-0" /> Full Networking CRM
                  </li>
                  <li className="flex items-center text-base text-white font-medium">
                    <CheckCircle2 className="w-6 h-6 text-blue-300 mr-3 shrink-0" /> Interview prep flashcards
                  </li>
                </ul>
                <Button className="w-full py-7 rounded-2xl bg-white text-blue-700 hover:bg-slate-50 hover:scale-[1.02] font-black text-lg shadow-xl shadow-black/10 transition-all">
                  Upgrade to Pro
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="w-full py-32 bg-white relative">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="max-w-2xl space-y-4"
              >
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Landed the offer.<br/>They used Zentail.
                </h2>
              </motion.div>
              <Button variant="link" className="text-blue-600 font-bold p-0 text-base hover:text-blue-700">
                Read more success stories <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              {[
                { 
                  quote: "I was drowning in 60+ applications. Zentail helped me see where I was failing in interviews, so I focused my prep and landed a role at a FAANG company.", 
                  name: "Rahul C.", role: "Software Engineer II", initial: "RC" 
                },
                { 
                  quote: "The Resume Manager alone is worth it. Sending the wrong resume is a fear I used to give me anxiety. Now it's all automated and linked correctly.", 
                  name: "Priya M.", role: "Data Analyst", initial: "PM" 
                },
                { 
                  quote: "The CRM feature helped me keep track of conversations I had at job fairs. Mentioning those details in interviews definitely set me apart.", 
                  name: "Karan V.", role: "Product Manager", initial: "KV" 
                }
              ].map((t, i) => (
                <motion.div key={i} variants={fadeUp} className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-100 p-10 rounded-3xl flex flex-col justify-between h-full hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 group">
                  <div>
                    <div className="flex gap-1 mb-6">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-emerald-500 text-emerald-500 drop-shadow-sm" />)}
                    </div>
                    <p className="text-slate-700 text-base leading-relaxed italic mb-10 font-medium">
                      "{t.quote}"
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full overflow-hidden flex items-center justify-center font-bold text-blue-700 shadow-sm border border-white">
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 w-full rounded-t-[3rem] mt-auto">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="bg-blue-500 rounded-lg p-1.5 shadow-lg shadow-blue-500/20">
                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-2xl tracking-tight text-white">Zentail</span>
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                Empowering students to land their dream careers through organized precision and AI insights.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-sm mb-6 text-white tracking-widest">FOR STUDENTS</h4>
              <ul className="space-y-4 text-sm text-slate-400 font-light">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Resume Tips</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Interview Prep</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Career Roadmap</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-sm mb-6 text-white tracking-widest">COMPANY</h4>
              <ul className="space-y-4 text-sm text-slate-400 font-light">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-6 text-white tracking-widest">CONNECT</h4>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-lg hover:scale-110">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-lg hover:scale-110">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-slate-800">
            <p className="text-xs text-slate-500 font-light">
              © 2026 Zentail. Built for the next generation of professionals.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Star(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
