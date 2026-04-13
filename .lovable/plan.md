## Enhancement Plan

### 1. Promotions & Coupons System
- **Database**: Create `promotions` table (code, discount_type, discount_value, min_order, max_uses, active, expiry)
- **Admin UI**: Section to create/edit/delete promo codes with all parameters
- **Checkout**: Apply coupon code field, validate & deduct discount from total

### 2. Flash Sale Management
- **Admin UI**: Toggle flash sale on/off per product, set sale price and optional timer/end date
- **Frontend**: Flash sale banner pulls from DB dynamically (currently may be static)

### 3. Order Management (Admin)
- **Admin UI**: Full order list with status filters, search by customer/order ID
- **Status updates**: Admin can change order status (pending → confirmed → processing → shipped → delivered → cancelled)
- **Order details**: View items, customer info, shipping, payment method

### 4. Banner/Hero Management
- **Database**: Create `banners` table (title, subtitle, image_url, link, active, display_order)
- **Admin UI**: Upload/manage homepage banners with ordering
- **Frontend**: Homepage hero pulls banners from DB instead of static content

### 5. Additional Polish
- Ensure all existing admin sections (products, categories) are fully functional
- Improve mobile responsiveness of admin panel

### Database migrations needed:
- `promotions` table with RLS
- `banners` table with RLS

Shall I proceed?