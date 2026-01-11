package com.example.shopflow.data

import androidx.compose.runtime.mutableStateListOf

object CartManager {
    private val _items = mutableStateListOf<CartItem>()
    val items: List<CartItem> get() = _items
    
    fun addToCart(product: Product) {
        val existing = _items.find { it.product.id == product.id }
        if (existing != null) {
            val index = _items.indexOf(existing)
            _items[index] = existing.copy(quantity = existing.quantity + 1)
        } else {
            _items.add(CartItem(product, 1))
        }
    }
    
    fun removeFromCart(productId: String) {
        _items.removeAll { it.product.id == productId }
    }
    
    fun updateQuantity(productId: String, quantity: Int) {
        val existing = _items.find { it.product.id == productId }
        if (existing != null) {
            if (quantity <= 0) {
                removeFromCart(productId)
            } else {
                val index = _items.indexOf(existing)
                _items[index] = existing.copy(quantity = quantity)
            }
        }
    }
    
    fun clearCart() {
        _items.clear()
    }
    
    fun getTotal(): Double = _items.sumOf { it.product.price * it.quantity }
    
    fun getItemCount(): Int = _items.sumOf { it.quantity }
}

data class CartItem(
    val product: Product,
    val quantity: Int
)

