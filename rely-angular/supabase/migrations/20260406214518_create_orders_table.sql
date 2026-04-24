/*
  # Create orders table for vehicle purchases

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text)
      - `phone` (text)
      - `reference_number` (text, unique)
      - `price` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `orders` table
    - Add policy for public insert (customers creating orders)
    - Add policy for authenticated admin viewing orders
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  reference_number text UNIQUE NOT NULL,
  price numeric DEFAULT 50000,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders"
  ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can view orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);
