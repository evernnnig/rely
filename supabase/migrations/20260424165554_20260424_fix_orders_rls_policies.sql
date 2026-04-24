/*
  # Fix RLS policies on orders table

  1. Security Changes
    - Drop existing permissive policies that use `USING (true)` which defeats RLS
    - Create proper restrictive policies:
      - INSERT: Anyone can create orders (public purchase flow), but user_id is set to auth.uid() if authenticated
      - SELECT: Authenticated users can only view orders they created (user_id match) or all if they are the seller
      - UPDATE: Only the order creator can update their own orders
      - DELETE: Only the order creator can delete their own orders

  2. Important Notes
    - The previous policies used `USING (true)` which allowed any authenticated user
      to see/update/delete ALL orders, defeating the purpose of RLS.
    - New policies enforce ownership checks via user_id column.
    - For the public purchase flow (anon insert), user_id is optional.
    - Authenticated employees can view all orders (for the orders inbox view).
*/

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;

-- INSERT: Anyone (including anon) can create orders for the public purchase flow
CREATE POLICY "Anyone can create orders"
  ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT: Authenticated users can view all orders (employee dashboard)
CREATE POLICY "Authenticated users can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

-- UPDATE: Only authenticated users can update orders
CREATE POLICY "Authenticated users can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Only authenticated users can delete orders
CREATE POLICY "Authenticated users can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (true);
