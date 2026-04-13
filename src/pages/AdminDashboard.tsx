import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Boxes,
  Copy,
  FolderTree,
  Loader2,
  Package,
  Pencil,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  ExternalLink,
  Eye,
  TicketPercent,
  Image,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ProductImageUploader from "@/components/admin/ProductImageUploader";
import type { Enums, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type OrderStatus = Enums<"order_status">;
type ProfileSummary = Pick<Tables<"profiles">, "user_id" | "full_name" | "email">;
type DashboardCategory = Tables<"categories">;

type DashboardOrder = Pick<
  Tables<"orders">,
  "id" | "user_id" | "total" | "status" | "payment_method" | "shipping_city" | "shipping_address" | "phone" | "created_at"
> & {
  customerName: string;
  customerEmail: string;
};

type DashboardProduct = Pick<
  Tables<"products">,
  | "id" | "name" | "price" | "original_price" | "image_url" | "description"
  | "in_stock" | "is_flash_sale" | "stock_quantity" | "category_id" | "created_at"
> & {
  categories: { name: string; slug: string } | null;
};

type Promotion = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
};

type DashboardStats = {
  customerCount: number;
  revenue: number;
  lowStockProducts: number;
  totalProducts: number;
  totalCategories: number;
  orderCount: number;
};

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  categoryId: string;
  stockQuantity: string;
  inStock: boolean;
  isFlashSale: boolean;
};

type CategoryFormState = { name: string; slug: string; icon: string; parentId: string };

type PromotionFormState = {
  code: string;
  discountType: string;
  discountValue: string;
  minOrderAmount: string;
  maxUses: string;
  isActive: boolean;
  expiresAt: string;
};

type BannerFormState = {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  displayOrder: string;
};

const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const defaultStats: DashboardStats = { customerCount: 0, revenue: 0, lowStockProducts: 0, totalProducts: 0, totalCategories: 0, orderCount: 0 };

const defaultProductForm: ProductFormState = {
  name: "", description: "", price: "", originalPrice: "", categoryId: "", stockQuantity: "0", inStock: true, isFlashSale: false,
};

const defaultCategoryForm: CategoryFormState = { name: "", slug: "", icon: "", parentId: "" };

const defaultPromotionForm: PromotionFormState = {
  code: "", discountType: "percentage", discountValue: "", minOrderAmount: "0", maxUses: "", isActive: true, expiresAt: "",
};

const defaultBannerForm: BannerFormState = {
  title: "", subtitle: "", imageUrl: "", linkUrl: "", isActive: true, displayOrder: "0",
};

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("en-UG", { dateStyle: "medium" });
const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatDate = (value: string) => { try { return dateFormatter.format(new Date(value)); } catch { return value; } };
const formatLabel = (value: string) => value.replace(/_/g, " ");
const titleCase = (value: string) => formatLabel(value).replace(/\b\w/g, (c) => c.toUpperCase());
const normalizeSlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const redirectHandled = useRef(false);

  const [activeSection, setActiveSection] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [categories, setCategories] = useState<DashboardCategory[]>([]);
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [productForm, setProductForm] = useState<ProductFormState>(defaultProductForm);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(defaultCategoryForm);
  const [promotionForm, setPromotionForm] = useState<PromotionFormState>(defaultPromotionForm);
  const [bannerForm, setBannerForm] = useState<BannerFormState>(defaultBannerForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [productSaving, setProductSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [promotionSaving, setPromotionSaving] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [productActionId, setProductActionId] = useState<string | null>(null);
  const [categoryActionId, setCategoryActionId] = useState<string | null>(null);
  const [orderActionId, setOrderActionId] = useState<string | null>(null);
  const [promotionActionId, setPromotionActionId] = useState<string | null>(null);
  const [bannerActionId, setBannerActionId] = useState<string | null>(null);

  // Order management state
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});

  const categoryProductCounts = useMemo(() => {
    return products.reduce<Record<string, number>>((counts, p) => {
      if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
      return counts;
    }, {});
  }, [products]);

  const lowStockProducts = useMemo(() => products.filter((p) => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= 5), [products]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
      const matchesSearch = !orderSearch || 
        o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.id.toLowerCase().includes(orderSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  const resetProductForm = () => { setProductForm(defaultProductForm); setEditingProductId(null); };
  const resetCategoryForm = () => { setCategoryForm(defaultCategoryForm); setEditingCategoryId(null); };
  const resetPromotionForm = () => { setPromotionForm(defaultPromotionForm); setEditingPromotionId(null); };
  const resetBannerForm = () => { setBannerForm(defaultBannerForm); setEditingBannerId(null); };

  const loadDashboard = async (showLoader = true) => {
    if (showLoader) setIsLoading(true); else setIsRefreshing(true);
    try {
      const [pcR, prR, otR, roR, cR, pR, promR, banR] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("user_id, full_name, email"),
        supabase.from("orders").select("id, total, status"),
        supabase.from("orders").select("id, user_id, total, status, payment_method, shipping_city, shipping_address, phone, created_at").order("created_at", { ascending: false }),
        supabase.from("categories").select("*, parent_id").order("name"),
        supabase.from("products").select("id, name, price, original_price, image_url, description, in_stock, is_flash_sale, stock_quantity, category_id, created_at, categories(name, slug)").order("created_at", { ascending: false }),
        supabase.from("promotions").select("*").order("created_at", { ascending: false }),
        supabase.from("banners").select("*").order("display_order"),
      ]);
      const loadError = pcR.error || prR.error || otR.error || roR.error || cR.error || pR.error || promR.error || banR.error;
      if (loadError) throw loadError;
      const profiles = (prR.data ?? []) as ProfileSummary[];
      const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
      const recentOrders = ((roR.data ?? []) as Tables<"orders">[]).map((o) => {
        const pr = profileMap.get(o.user_id);
        return { ...o, customerName: pr?.full_name || "Customer", customerEmail: pr?.email || "No email" };
      });
      const dc = (cR.data ?? []) as DashboardCategory[];
      const dp = (pR.data ?? []) as DashboardProduct[];
      const ot = (otR.data ?? []) as Pick<Tables<"orders">, "total" | "status">[];
      setStats({
        customerCount: pcR.count ?? profiles.length,
        revenue: ot.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total ?? 0), 0),
        lowStockProducts: dp.filter((p) => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= 5).length,
        totalProducts: dp.length, totalCategories: dc.length, orderCount: ot.length,
      });
      setOrders(recentOrders); setCategories(dc); setProducts(dp);
      setPromotions((promR.data ?? []) as Promotion[]);
      setBanners((banR.data ?? []) as Banner[]);
    } catch (e) {
      console.error("Failed to load dashboard", e);
      toast({ variant: "destructive", title: "Dashboard unavailable", description: "Could not load the latest data." });
    } finally { setIsLoading(false); setIsRefreshing(false); }
  };

  useEffect(() => {
    if (authLoading || redirectHandled.current) return;
    if (!user) { redirectHandled.current = true; navigate("/account", { replace: true }); return; }
    if (!isAdmin) {
      redirectHandled.current = true;
      toast({ variant: "destructive", title: "Admin access required", description: "Only admin accounts can open the dashboard." });
      navigate("/account", { replace: true });
    }
  }, [authLoading, isAdmin, navigate, toast, user]);

  useEffect(() => { if (!authLoading && user && isAdmin) void loadDashboard(true); }, [authLoading, isAdmin, user]);

  const handleRefresh = () => loadDashboard(false);

  const handleProductSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = productForm.name.trim();
    const description = productForm.description.trim();
    const price = Number(productForm.price);
    const stockQuantity = Number(productForm.stockQuantity);
    const originalPrice = productForm.originalPrice.trim() ? Number(productForm.originalPrice) : null;
    if (!name) { toast({ variant: "destructive", title: "Product name required" }); return; }
    if (!Number.isFinite(price) || price <= 0) { toast({ variant: "destructive", title: "Invalid price" }); return; }
    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) { toast({ variant: "destructive", title: "Invalid stock" }); return; }
    if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice < price)) { toast({ variant: "destructive", title: "Invalid original price" }); return; }

    const payload: TablesInsert<"products"> = {
      name, description: description || null, price, original_price: originalPrice,
      image_url: null, category_id: productForm.categoryId || null, seller_id: null,
      stock_quantity: stockQuantity, in_stock: productForm.inStock && stockQuantity > 0,
      is_flash_sale: productForm.isFlashSale, updated_at: new Date().toISOString(),
    };
    setProductSaving(true);
    try {
      if (editingProductId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingProductId);
        if (error) throw error;
        toast({ title: "Product updated", description: `${name} is now up to date.` });
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast({ title: "Product created", description: `${name} was added.` });
      }
      resetProductForm(); await loadDashboard(false);
    } catch (e) {
      console.error("Failed to save product", e);
      toast({ variant: "destructive", title: "Could not save product" });
    } finally { setProductSaving(false); }
  };

  const handleCategorySubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = categoryForm.name.trim();
    const icon = categoryForm.icon.trim();
    const slug = normalizeSlug(categoryForm.slug || name);
    if (!name) { toast({ variant: "destructive", title: "Category name required" }); return; }
    if (!slug) { toast({ variant: "destructive", title: "Invalid slug" }); return; }
    setCategorySaving(true);
    try {
      if (editingCategoryId) {
        const { error } = await supabase.from("categories").update({ name, slug, icon: icon || null, parent_id: categoryForm.parentId || null } as any).eq("id", editingCategoryId);
        if (error) throw error;
        toast({ title: "Category updated" });
      } else {
        const { error } = await supabase.from("categories").insert({ name, slug, icon: icon || null, parent_id: categoryForm.parentId || null } as any);
        if (error) throw error;
        toast({ title: "Category created" });
      }
      resetCategoryForm(); await loadDashboard(false);
    } catch (e) {
      console.error("Failed to save category", e);
      toast({ variant: "destructive", title: "Could not save category" });
    } finally { setCategorySaving(false); }
  };

  const handlePromotionSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = promotionForm.code.trim().toUpperCase();
    const discountValue = Number(promotionForm.discountValue);
    const minOrderAmount = Number(promotionForm.minOrderAmount) || 0;
    const maxUses = promotionForm.maxUses.trim() ? Number(promotionForm.maxUses) : null;
    if (!code) { toast({ variant: "destructive", title: "Promotion code required" }); return; }
    if (!Number.isFinite(discountValue) || discountValue <= 0) { toast({ variant: "destructive", title: "Invalid discount value" }); return; }
    setPromotionSaving(true);
    try {
      const payload = {
        code,
        discount_type: promotionForm.discountType,
        discount_value: discountValue,
        min_order_amount: minOrderAmount,
        max_uses: maxUses,
        is_active: promotionForm.isActive,
        expires_at: promotionForm.expiresAt || null,
      };
      if (editingPromotionId) {
        const { error } = await supabase.from("promotions").update(payload as any).eq("id", editingPromotionId);
        if (error) throw error;
        toast({ title: "Promotion updated" });
      } else {
        const { error } = await supabase.from("promotions").insert(payload as any);
        if (error) throw error;
        toast({ title: "Promotion created" });
      }
      resetPromotionForm(); await loadDashboard(false);
    } catch (e: any) {
      console.error("Failed to save promotion", e);
      toast({ variant: "destructive", title: "Could not save promotion", description: e?.message?.includes("duplicate") ? "This code already exists." : undefined });
    } finally { setPromotionSaving(false); }
  };

  const handleBannerSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = bannerForm.title.trim();
    if (!title) { toast({ variant: "destructive", title: "Banner title required" }); return; }
    setBannerSaving(true);
    try {
      const payload = {
        title,
        subtitle: bannerForm.subtitle.trim() || null,
        image_url: bannerForm.imageUrl.trim() || null,
        link_url: bannerForm.linkUrl.trim() || null,
        is_active: bannerForm.isActive,
        display_order: Number(bannerForm.displayOrder) || 0,
      };
      if (editingBannerId) {
        const { error } = await supabase.from("banners").update(payload as any).eq("id", editingBannerId);
        if (error) throw error;
        toast({ title: "Banner updated" });
      } else {
        const { error } = await supabase.from("banners").insert(payload as any);
        if (error) throw error;
        toast({ title: "Banner created" });
      }
      resetBannerForm(); await loadDashboard(false);
    } catch (e) {
      console.error("Failed to save banner", e);
      toast({ variant: "destructive", title: "Could not save banner" });
    } finally { setBannerSaving(false); }
  };

  const handleEditProduct = (p: DashboardProduct) => {
    setEditingProductId(p.id);
    setProductForm({
      name: p.name, description: p.description || "", price: String(p.price),
      originalPrice: p.original_price ? String(p.original_price) : "",
      categoryId: p.category_id || "", stockQuantity: String(p.stock_quantity ?? 0),
      inStock: Boolean(p.in_stock), isFlashSale: Boolean(p.is_flash_sale),
    });
    setActiveSection("products");
  };

  const handleEditCategory = (c: DashboardCategory) => {
    setEditingCategoryId(c.id);
    setCategoryForm({ name: c.name, slug: c.slug, icon: c.icon || "", parentId: (c as any).parent_id || "" });
    setActiveSection("categories");
  };

  const handleEditPromotion = (p: Promotion) => {
    setEditingPromotionId(p.id);
    setPromotionForm({
      code: p.code,
      discountType: p.discount_type,
      discountValue: String(p.discount_value),
      minOrderAmount: String(p.min_order_amount),
      maxUses: p.max_uses !== null ? String(p.max_uses) : "",
      isActive: p.is_active,
      expiresAt: p.expires_at ? p.expires_at.slice(0, 16) : "",
    });
    setActiveSection("promotions");
  };

  const handleEditBanner = (b: Banner) => {
    setEditingBannerId(b.id);
    setBannerForm({
      title: b.title,
      subtitle: b.subtitle || "",
      imageUrl: b.image_url || "",
      linkUrl: b.link_url || "",
      isActive: b.is_active,
      displayOrder: String(b.display_order),
    });
    setActiveSection("banners");
  };

  const handleDeleteProduct = async (product: DashboardProduct) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    setProductActionId(product.id);
    try {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
      if (editingProductId === product.id) resetProductForm();
      toast({ title: "Product deleted" });
      await loadDashboard(false);
    } catch { toast({ variant: "destructive", title: "Could not delete product" }); }
    finally { setProductActionId(null); }
  };

  const handleDeleteCategory = async (category: DashboardCategory) => {
    const linked = categoryProductCounts[category.id] ?? 0;
    if (linked > 0) { toast({ variant: "destructive", title: "Category has products", description: `Move or delete ${linked} product(s) first.` }); return; }
    if (!window.confirm(`Delete ${category.name}?`)) return;
    setCategoryActionId(category.id);
    try {
      const { error } = await supabase.from("categories").delete().eq("id", category.id);
      if (error) throw error;
      if (editingCategoryId === category.id) resetCategoryForm();
      toast({ title: "Category deleted" });
      await loadDashboard(false);
    } catch { toast({ variant: "destructive", title: "Could not delete category" }); }
    finally { setCategoryActionId(null); }
  };

  const handleDeletePromotion = async (p: Promotion) => {
    if (!window.confirm(`Delete promo "${p.code}"?`)) return;
    setPromotionActionId(p.id);
    try {
      const { error } = await supabase.from("promotions").delete().eq("id", p.id);
      if (error) throw error;
      if (editingPromotionId === p.id) resetPromotionForm();
      toast({ title: "Promotion deleted" });
      await loadDashboard(false);
    } catch { toast({ variant: "destructive", title: "Could not delete promotion" }); }
    finally { setPromotionActionId(null); }
  };

  const handleDeleteBanner = async (b: Banner) => {
    if (!window.confirm(`Delete banner "${b.title}"?`)) return;
    setBannerActionId(b.id);
    try {
      const { error } = await supabase.from("banners").delete().eq("id", b.id);
      if (error) throw error;
      if (editingBannerId === b.id) resetBannerForm();
      toast({ title: "Banner deleted" });
      await loadDashboard(false);
    } catch { toast({ variant: "destructive", title: "Could not delete banner" }); }
    finally { setBannerActionId(null); }
  };

  const handleToggleProductFlag = async (product: DashboardProduct, field: "in_stock" | "is_flash_sale") => {
    setProductActionId(product.id);
    try {
      const nextInStock = field === "in_stock" ? !Boolean(product.in_stock) : Boolean(product.in_stock);
      const nextStockQuantity = field === "in_stock" && nextInStock ? Math.max(product.stock_quantity ?? 0, 1) : product.stock_quantity;
      const updates: TablesUpdate<"products"> = { stock_quantity: nextStockQuantity, updated_at: new Date().toISOString() };
      if (field === "in_stock") updates.in_stock = nextInStock; else updates.is_flash_sale = !Boolean(product.is_flash_sale);
      const { error } = await supabase.from("products").update(updates).eq("id", product.id);
      if (error) throw error;
      toast({ title: "Updated" });
      await loadDashboard(false);
    } catch { toast({ variant: "destructive", title: "Could not update" }); }
    finally { setProductActionId(null); }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    setOrderActionId(orderId);
    try {
      const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
      if (error) throw error;
      toast({ title: "Order updated", description: `Status → ${titleCase(status)}` });
      await loadDashboard(false);
    } catch { toast({ variant: "destructive", title: "Could not update order" }); }
    finally { setOrderActionId(null); }
  };

  const loadOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    const { data, error } = await supabase
      .from("order_items")
      .select("id, quantity, price, product_id, products(name)")
      .eq("order_id", orderId);
    if (!error && data) {
      setOrderItems((prev) => ({ ...prev, [orderId]: data }));
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      loadOrderItems(orderId);
    }
  };

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Preparing dashboard...</span>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Customers", value: stats.customerCount, icon: ShoppingBag },
          { label: "Revenue", value: formatCurrency(stats.revenue), icon: Boxes },
          { label: "Orders", value: stats.orderCount, icon: ShoppingBag },
          { label: "Low Stock", value: stats.lowStockProducts, icon: Package },
          { label: "Products", value: stats.totalProducts, icon: Boxes },
          { label: "Categories", value: stats.totalCategories, icon: FolderTree },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="rounded-2xl">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="rounded-2xl border-amber-200">
          <CardHeader><CardTitle className="text-lg">⚠️ Low Stock Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.stock_quantity} left</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleEditProduct(p)}>Restock</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-lg">Recent Orders</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="font-medium text-sm">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(order.total)} • {formatDate(order.created_at)}</p>
              </div>
              <Badge variant={order.status === "delivered" ? "default" : "secondary"}>{titleCase(order.status)}</Badge>
            </div>
          ))}
          {orders.length > 5 && (
            <Button variant="ghost" size="sm" onClick={() => setActiveSection("orders")} className="w-full">
              View all orders →
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active promotions overview */}
      {promotions.filter(p => p.is_active).length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-lg">🎟️ Active Promotions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {promotions.filter(p => p.is_active).slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="font-medium text-sm font-mono">{p.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.discount_type === "percentage" ? `${p.discount_value}% off` : `${formatCurrency(p.discount_value)} off`}
                    {p.max_uses ? ` • ${p.current_uses}/${p.max_uses} used` : ` • ${p.current_uses} used`}
                  </p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setActiveSection("promotions")} className="w-full">
              Manage promotions →
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">{editingProductId ? "Edit Product" : "Add Product"}</CardTitle>
          <CardDescription>Fill in the details, then upload images after saving.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleProductSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="p-name">Product name</Label>
                <Input id="p-name" value={productForm.name} onChange={(e) => setProductForm((c) => ({ ...c, name: e.target.value }))} placeholder="Samsung Galaxy A15" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-price">Price (UGX)</Label>
                <Input id="p-price" type="number" min="0" step="100" value={productForm.price} onChange={(e) => setProductForm((c) => ({ ...c, price: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-orig">Original price</Label>
                <Input id="p-orig" type="number" min="0" step="100" value={productForm.originalPrice} onChange={(e) => setProductForm((c) => ({ ...c, originalPrice: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-cat">Category</Label>
                <select id="p-cat" value={productForm.categoryId} onChange={(e) => setProductForm((c) => ({ ...c, categoryId: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Uncategorized</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-stock">Stock quantity</Label>
                <Input id="p-stock" type="number" min="0" value={productForm.stockQuantity} onChange={(e) => setProductForm((c) => ({ ...c, stockQuantity: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="p-desc">Description</Label>
                <Textarea id="p-desc" value={productForm.description} onChange={(e) => setProductForm((c) => ({ ...c, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 rounded-xl border border-dashed border-border p-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={productForm.inStock} onChange={(e) => setProductForm((c) => ({ ...c, inStock: e.target.checked }))} className="h-4 w-4 accent-primary" />
                In stock
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={productForm.isFlashSale} onChange={(e) => setProductForm((c) => ({ ...c, isFlashSale: e.target.checked }))} className="h-4 w-4 accent-primary" />
                Flash sale
              </label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={productSaving}>
                {productSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {editingProductId ? "Update" : "Create"} Product
              </Button>
              {editingProductId && <Button type="button" variant="outline" onClick={resetProductForm}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      {editingProductId && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Product Images</CardTitle>
            <CardDescription>Upload up to 4 images. The first image is used as the main product photo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductImageUploader productId={editingProductId} />
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">All Products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No products yet.</p>
          ) : products.map((p) => (
            <div key={p.id} className="rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/product/${p.id}`} className="text-base font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1">
                      {p.name}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </Link>
                    <Badge variant={p.in_stock ? "default" : "secondary"} className="text-[10px]">
                      {p.in_stock ? "In stock" : "Out of stock"}
                    </Badge>
                    {p.is_flash_sale && <Badge variant="outline" className="text-[10px]">Flash Sale</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(p.price)} • {p.categories?.name || "Uncategorized"} • Qty: {p.stock_quantity ?? 0} • {formatDate(p.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link to={`/product/${p.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors">
                    <Eye className="h-3 w-3" /> View
                  </Link>
                  <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/product/${p.id}`);
                      toast({ title: "Link copied!" });
                    }}>
                    <Copy className="h-3 w-3" /> Link
                  </button>
                  <Button size="sm" variant="outline" onClick={() => handleEditProduct(p)}>
                    <Pencil className="h-3 w-3 mr-1" />Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggleProductFlag(p, "in_stock")} disabled={productActionId === p.id}>
                    {p.in_stock ? "Out of Stock" : "In Stock"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggleProductFlag(p, "is_flash_sale")} disabled={productActionId === p.id}>
                    {p.is_flash_sale ? "Remove Deal" : "Add Deal"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(p)} disabled={productActionId === p.id}>
                    {productActionId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">{editingCategoryId ? "Edit Category" : "Add Category"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCategorySubmit}>
            <div className="space-y-2">
              <Label>Category name</Label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm((c) => ({ ...c, name: e.target.value }))} placeholder="Smartphones" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={categoryForm.slug} onChange={(e) => setCategoryForm((c) => ({ ...c, slug: e.target.value }))} placeholder="smartphones" />
              <p className="text-xs text-muted-foreground">Auto-generated if left blank.</p>
            </div>
            <div className="space-y-2">
              <Label>Icon (emoji)</Label>
              <Input value={categoryForm.icon} onChange={(e) => setCategoryForm((c) => ({ ...c, icon: e.target.value }))} placeholder="📱" />
            </div>
            <div className="space-y-2">
              <Label>Parent Category (optional – makes this a subcategory)</Label>
              <select value={categoryForm.parentId} onChange={(e) => setCategoryForm((c) => ({ ...c, parentId: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">None (top-level)</option>
                {categories.filter((c) => !(c as any).parent_id && c.id !== editingCategoryId).map((c) => (
                  <option key={c.id} value={c.id}>{c.icon || "📦"} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={categorySaving}>
                {categorySaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {editingCategoryId ? "Update" : "Create"} Category
              </Button>
              {editingCategoryId && <Button type="button" variant="outline" onClick={resetCategoryForm}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">All Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No categories yet.</p>
          ) : (() => {
            const topLevel = categories.filter((c) => !(c as any).parent_id);
            const getChildren = (parentId: string) => categories.filter((c) => (c as any).parent_id === parentId);
            return topLevel.map((c) => (
              <div key={c.id} className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{c.icon || "📦"}</span>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">/{c.slug} • {categoryProductCounts[c.id] ?? 0} products</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditCategory(c)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(c)} disabled={categoryActionId === c.id}>
                      {categoryActionId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                {getChildren(c.id).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between rounded-xl border border-border/50 p-3 ml-8 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{sub.icon || "📁"}</span>
                      <div>
                        <p className="font-medium text-sm">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">/{sub.slug} • {categoryProductCounts[sub.id] ?? 0} products • sub of {c.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditCategory(sub)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(sub)} disabled={categoryActionId === sub.id}>
                        {categoryActionId === sub.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ));
          })()}
        </CardContent>
      </Card>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, or order ID..." 
                value={orderSearch} 
                onChange={(e) => setOrderSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[160px]"
            >
              <option value="all">All Statuses</option>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>Click an order to see details. Update status from the dropdown.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No orders match your filters.</p>
          ) : filteredOrders.map((o) => (
            <div key={o.id} className="rounded-xl border border-border overflow-hidden">
              <div 
                className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleOrderExpand(o.id)}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{o.customerName}</p>
                    <Badge variant={o.status === "delivered" ? "default" : o.status === "cancelled" ? "destructive" : "secondary"} className="text-[10px]">{titleCase(o.status)}</Badge>
                    {expandedOrderId === o.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    #{o.id.slice(0, 8)} • {o.customerEmail} • {formatCurrency(o.total)} • {titleCase(o.payment_method)} • {formatDate(o.created_at)}
                  </p>
                </div>
                <select
                  value={o.status}
                  disabled={orderActionId === o.id}
                  onChange={(e) => { e.stopPropagation(); handleOrderStatusChange(o.id, e.target.value as OrderStatus); }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-9 min-w-[160px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </select>
              </div>
              
              {expandedOrderId === o.id && (
                <div className="border-t border-border bg-muted/20 p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Phone</p>
                      <p className="mt-1">{o.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">City</p>
                      <p className="mt-1">{o.shipping_city || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Address</p>
                      <p className="mt-1">{o.shipping_address || "Not provided"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">Order Items</p>
                    {!orderItems[o.id] ? (
                      <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Loading...</p>
                    ) : orderItems[o.id].length === 0 ? (
                      <p className="text-sm text-muted-foreground">No items found.</p>
                    ) : (
                      <div className="space-y-1">
                        {orderItems[o.id].map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm rounded-lg bg-background border border-border px-3 py-2">
                            <span>{(item.products as any)?.name || "Unknown product"} × {item.quantity}</span>
                            <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderPromotions = () => (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">{editingPromotionId ? "Edit Promotion" : "Create Promotion"}</CardTitle>
          <CardDescription>Set up discount codes customers can use at checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePromotionSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Promo Code</Label>
                <Input value={promotionForm.code} onChange={(e) => setPromotionForm((c) => ({ ...c, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" />
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <select value={promotionForm.discountType} onChange={(e) => setPromotionForm((c) => ({ ...c, discountType: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (UGX)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input type="number" min="0" step="1" value={promotionForm.discountValue} onChange={(e) => setPromotionForm((c) => ({ ...c, discountValue: e.target.value }))} placeholder={promotionForm.discountType === "percentage" ? "e.g. 20" : "e.g. 5000"} />
              </div>
              <div className="space-y-2">
                <Label>Min Order Amount (UGX)</Label>
                <Input type="number" min="0" step="100" value={promotionForm.minOrderAmount} onChange={(e) => setPromotionForm((c) => ({ ...c, minOrderAmount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Max Uses (leave empty for unlimited)</Label>
                <Input type="number" min="1" value={promotionForm.maxUses} onChange={(e) => setPromotionForm((c) => ({ ...c, maxUses: e.target.value }))} placeholder="Unlimited" />
              </div>
              <div className="space-y-2">
                <Label>Expires At (optional)</Label>
                <Input type="datetime-local" value={promotionForm.expiresAt} onChange={(e) => setPromotionForm((c) => ({ ...c, expiresAt: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 rounded-xl border border-dashed border-border p-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={promotionForm.isActive} onChange={(e) => setPromotionForm((c) => ({ ...c, isActive: e.target.checked }))} className="h-4 w-4 accent-primary" />
                Active
              </label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={promotionSaving}>
                {promotionSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {editingPromotionId ? "Update" : "Create"} Promotion
              </Button>
              {editingPromotionId && <Button type="button" variant="outline" onClick={resetPromotionForm}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">All Promotions ({promotions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {promotions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No promotions yet.</p>
          ) : promotions.map((p) => (
            <div key={p.id} className="rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm font-mono">{p.code}</p>
                    <Badge variant={p.is_active ? "default" : "secondary"} className="text-[10px]">
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {p.expires_at && new Date(p.expires_at) < new Date() && (
                      <Badge variant="destructive" className="text-[10px]">Expired</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.discount_type === "percentage" ? `${p.discount_value}% off` : `${formatCurrency(p.discount_value)} off`}
                    {p.min_order_amount > 0 ? ` • Min: ${formatCurrency(p.min_order_amount)}` : ""}
                    {p.max_uses ? ` • ${p.current_uses}/${p.max_uses} used` : ` • ${p.current_uses} used`}
                    {p.expires_at ? ` • Expires: ${formatDate(p.expires_at)}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEditPromotion(p)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeletePromotion(p)} disabled={promotionActionId === p.id}>
                    {promotionActionId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderBanners = () => (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">{editingBannerId ? "Edit Banner" : "Create Banner"}</CardTitle>
          <CardDescription>Manage homepage hero banners. Active banners show on the homepage.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleBannerSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Title</Label>
                <Input value={bannerForm.title} onChange={(e) => setBannerForm((c) => ({ ...c, title: e.target.value }))} placeholder="Summer Sale is Here!" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Subtitle</Label>
                <Input value={bannerForm.subtitle} onChange={(e) => setBannerForm((c) => ({ ...c, subtitle: e.target.value }))} placeholder="Up to 50% off on all electronics" />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={bannerForm.imageUrl} onChange={(e) => setBannerForm((c) => ({ ...c, imageUrl: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Link URL (optional)</Label>
                <Input value={bannerForm.linkUrl} onChange={(e) => setBannerForm((c) => ({ ...c, linkUrl: e.target.value }))} placeholder="/deals or https://..." />
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" min="0" value={bannerForm.displayOrder} onChange={(e) => setBannerForm((c) => ({ ...c, displayOrder: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 rounded-xl border border-dashed border-border p-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={bannerForm.isActive} onChange={(e) => setBannerForm((c) => ({ ...c, isActive: e.target.checked }))} className="h-4 w-4 accent-primary" />
                Active (shows on homepage)
              </label>
            </div>
            {bannerForm.imageUrl && (
              <div className="rounded-xl border border-border overflow-hidden">
                <img src={bannerForm.imageUrl} alt="Banner preview" className="w-full h-32 object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
            <div className="flex gap-3">
              <Button type="submit" disabled={bannerSaving}>
                {bannerSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {editingBannerId ? "Update" : "Create"} Banner
              </Button>
              {editingBannerId && <Button type="button" variant="outline" onClick={resetBannerForm}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">All Banners ({banners.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {banners.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No banners yet. Create one to display on the homepage.</p>
          ) : banners.map((b) => (
            <div key={b.id} className="rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  {b.image_url && (
                    <img src={b.image_url} alt={b.title} className="w-16 h-10 rounded-lg object-cover border border-border" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{b.title}</p>
                      <Badge variant={b.is_active ? "default" : "secondary"} className="text-[10px]">
                        {b.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {b.subtitle || "No subtitle"} • Order: {b.display_order}
                      {b.link_url ? ` • Links to: ${b.link_url}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEditBanner(b)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteBanner(b)} disabled={bannerActionId === b.id}>
                    {bannerActionId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const sectionTitles: Record<string, string> = {
    overview: "Dashboard Overview",
    products: "Product Management",
    categories: "Category Management",
    orders: "Order Management",
    promotions: "Promotions & Coupons",
    banners: "Banner Management",
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4 py-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h1 className="text-lg font-display font-bold text-foreground">{sectionTitles[activeSection]}</h1>
            </div>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline ml-1">Refresh</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 max-w-6xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <>
                {activeSection === "overview" && renderOverview()}
                {activeSection === "products" && renderProducts()}
                {activeSection === "categories" && renderCategories()}
                {activeSection === "orders" && renderOrders()}
                {activeSection === "promotions" && renderPromotions()}
                {activeSection === "banners" && renderBanners()}
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
