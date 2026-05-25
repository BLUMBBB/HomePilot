import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import { DashboardLayout } from '@/components/DashboardLayout'
import { HomePage } from '@/pages/HomePage'
import { TariffsPage } from '@/pages/TariffsPage'
import { HowItWorksPage } from '@/pages/HowItWorksPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ConfirmEmailPage } from '@/pages/ConfirmEmailPage'
import { BookingPage } from '@/pages/BookingPage'
import { DashboardOverview } from '@/pages/dashboard/DashboardOverview'
import { DashboardVisits } from '@/pages/dashboard/DashboardVisits'
import { DashboardVisitDetail } from '@/pages/dashboard/DashboardVisitDetail'
import { DashboardSubscription } from '@/pages/dashboard/DashboardSubscription'
import { DashboardSlots } from '@/pages/dashboard/DashboardSlots'
import { DashboardProfile } from '@/pages/dashboard/DashboardProfile'
import { ExecutorLayout } from '@/components/ExecutorLayout'
import { ExecutorOverview } from '@/pages/executor/ExecutorOverview'
import { ExecutorVisitsPage } from '@/pages/executor/ExecutorVisitsPage'
import { ExecutorVisitDetailPage } from '@/pages/executor/ExecutorVisitDetailPage'
import { ExecutorProfile } from '@/pages/executor/ExecutorProfile'
import { AdminLayout } from '@/components/AdminLayout'
import { AdminOverview } from '@/pages/admin/AdminOverview'
import { AdminUsers } from '@/pages/admin/AdminUsers'
import { AdminUserDetail } from '@/pages/admin/AdminUserDetail'
import { AdminSubscriptions } from '@/pages/admin/AdminSubscriptions'
import { AdminSubscriptionDetail } from '@/pages/admin/AdminSubscriptionDetail'
import { AdminVisits } from '@/pages/admin/AdminVisits'
import { AdminVisitDetail } from '@/pages/admin/AdminVisitDetail'
import { AdminExecutors } from '@/pages/admin/AdminExecutors'
import { AdminSupport } from '@/pages/admin/AdminSupport'
import { AdminTicketDetail } from '@/pages/admin/AdminTicketDetail'
import { AdminPayments } from '@/pages/admin/AdminPayments'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { RegisterExecutorPage } from '@/pages/RegisterExecutorPage'
import { ClientSupportList } from '@/pages/support/ClientSupportList'
import { ClientSupportTicket } from '@/pages/support/ClientSupportTicket'
import { PrivacyPolicyPage } from '@/pages/legal/PrivacyPolicyPage'
import { TermsOfServicePage } from '@/pages/legal/TermsOfServicePage'
import { PublicOfferPage } from '@/pages/legal/PublicOfferPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="tariffs" element={<TariffsPage />} />
            <Route path="booking" element={<BookingPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="legal/privacy" element={<PrivacyPolicyPage />} />
            <Route path="legal/terms" element={<TermsOfServicePage />} />
            <Route path="legal/offer" element={<PublicOfferPage />} />
            <Route path="privacy" element={<Navigate to="/legal/privacy" replace />} />
          </Route>
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="slots" element={<DashboardSlots />} />
            <Route path="visits" element={<DashboardVisits />} />
            <Route path="visits/:visitId" element={<DashboardVisitDetail />} />
            <Route path="subscription" element={<DashboardSubscription />} />
            <Route path="profile" element={<DashboardProfile />} />
            <Route path="support" element={<ClientSupportList basePath="/dashboard" />} />
            <Route path="support/:ticketId" element={<ClientSupportTicket basePath="/dashboard" />} />
          </Route>
          <Route path="executor" element={<ExecutorLayout />}>
            <Route index element={<ExecutorOverview />} />
            <Route path="visits" element={<ExecutorVisitsPage />} />
            <Route path="visits/:visitId" element={<ExecutorVisitDetailPage />} />
            <Route path="profile" element={<ExecutorProfile />} />
            <Route path="support" element={<ClientSupportList basePath="/executor" />} />
            <Route path="support/:ticketId" element={<ClientSupportTicket basePath="/executor" />} />
          </Route>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetail />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="subscriptions/:subscriptionId" element={<AdminSubscriptionDetail />} />
            <Route path="visits" element={<AdminVisits />} />
            <Route path="visits/:visitId" element={<AdminVisitDetail />} />
            <Route path="executors" element={<AdminExecutors />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="support/:ticketId" element={<AdminTicketDetail />} />
            <Route path="payments" element={<AdminPayments />} />
          </Route>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="register-executor" element={<RegisterExecutorPage />} />
          <Route path="auth/confirm-email" element={<ConfirmEmailPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
