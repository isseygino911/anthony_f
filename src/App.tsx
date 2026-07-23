import { Route, Routes } from 'react-router-dom';
import { RequireAdmin } from './components/admin/RequireAdmin';
import { AdminLayout } from './components/layout/AdminLayout';
import { RequireAuth } from './components/layout/RequireAuth';
import { SmoothScrollProvider } from './components/layout/SmoothScrollProvider';
import { StorefrontLayout } from './components/layout/StorefrontLayout';
import { AssistantProvider } from './hooks/useAssistant';
import { AuthProvider } from './hooks/useAuth';
import { CartProvider } from './hooks/useCart';
import { FavoritesProvider } from './hooks/useFavorites';
import { CustomNeonDesignDetail } from './pages/admin/CustomNeonDesignDetail';
import { CustomNeonDesigns } from './pages/admin/CustomNeonDesigns';
import { CustomNeonUsage } from './pages/admin/CustomNeonUsage';
import { Dashboard } from './pages/admin/Dashboard';
import { Groups } from './pages/admin/Groups';
import { Newsletter } from './pages/admin/Newsletter';
import { Notifications } from './pages/admin/Notifications';
import { OrderDetail } from './pages/admin/OrderDetail';
import { Orders as AdminOrders } from './pages/admin/Orders';
import { ProductForm } from './pages/admin/ProductForm';
import { Products as AdminProducts } from './pages/admin/Products';
import { AdminResources } from './pages/admin/Resources';
import { Insights } from './pages/admin/Insights';
import { ThemeSettings } from './pages/admin/ThemeSettings';
import { Favorites } from './pages/storefront/Account/Favorites';
import { Orders as MyOrders } from './pages/storefront/Account/Orders';
import { CartPage } from './pages/storefront/Cart';
import { CategoryPage } from './pages/storefront/Category';
import { CompanyInsights } from './pages/storefront/CompanyInsights';
import { CustomNeon } from './pages/storefront/CustomNeon';
import { Checkout } from './pages/storefront/Checkout';
import { GroupPage } from './pages/storefront/Group';
import { Home } from './pages/storefront/Home';
import { Login } from './pages/storefront/Login';
import { OrderConfirmation } from './pages/storefront/OrderConfirmation';
import { ProductDetail } from './pages/storefront/ProductDetail';
import { Register } from './pages/storefront/Register';
import { ResourceDetail } from './pages/storefront/ResourceDetail';
import { Resources } from './pages/storefront/Resources';
import { ThemeProvider } from './theme/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <AssistantProvider>
              <SmoothScrollProvider>
              <Routes>
                <Route element={<StorefrontLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<CategoryPage />} />
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/group/:id" element={<GroupPage />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/resources/:id" element={<ResourceDetail />} />
                  <Route path="/company-insights" element={<CompanyInsights />} />
                  <Route
                    path="/custom-neon"
                    element={
                      <RequireAuth>
                        <CustomNeon />
                      </RequireAuth>
                    }
                  />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/checkout"
                    element={
                      <RequireAuth>
                        <Checkout />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/order-confirmation/:id"
                    element={
                      <RequireAuth>
                        <OrderConfirmation />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/account/favorites"
                    element={
                      <RequireAuth>
                        <Favorites />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/account/orders"
                    element={
                      <RequireAuth>
                        <MyOrders />
                      </RequireAuth>
                    }
                  />
                </Route>

                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <AdminLayout />
                    </RequireAdmin>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/:id" element={<ProductForm />} />
                  <Route path="groups" element={<Groups />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="orders/:id" element={<OrderDetail />} />
                  <Route path="custom-neon-designs" element={<CustomNeonDesigns />} />
                  <Route path="custom-neon-designs/:id" element={<CustomNeonDesignDetail />} />
                  <Route path="custom-neon-usage" element={<CustomNeonUsage />} />
                  <Route path="theme" element={<ThemeSettings />} />
                  <Route path="newsletter" element={<Newsletter />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="resources" element={<AdminResources />} />
                  <Route path="insights" element={<Insights />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              </SmoothScrollProvider>
            </AssistantProvider>
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function NotFound() {
  return (
    <div className="container flex flex-col items-center gap-2 py-24 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
    </div>
  );
}

export default App;
