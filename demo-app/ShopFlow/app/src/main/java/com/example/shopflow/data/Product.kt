package com.example.shopflow.data

data class Product(
    val id: String,
    val name: String,
    val description: String,
    val price: Double,
    val imageUrl: String,
    val category: String
)

object SampleProducts {
    val products = listOf(
        Product(
            id = "1",
            name = "Wireless Headphones",
            description = "Premium noise-cancelling wireless headphones with 30-hour battery life.",
            price = 299.99,
            imageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
            category = "Electronics"
        ),
        Product(
            id = "2",
            name = "Smart Watch",
            description = "Track your fitness and stay connected with this sleek smartwatch.",
            price = 399.99,
            imageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
            category = "Electronics"
        ),
        Product(
            id = "3",
            name = "Running Shoes",
            description = "Lightweight running shoes with responsive cushioning.",
            price = 129.99,
            imageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
            category = "Sports"
        ),
        Product(
            id = "4",
            name = "Backpack",
            description = "Durable laptop backpack with multiple compartments.",
            price = 79.99,
            imageUrl = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
            category = "Accessories"
        ),
        Product(
            id = "5",
            name = "Sunglasses",
            description = "Classic aviator sunglasses with polarized lenses.",
            price = 159.99,
            imageUrl = "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
            category = "Accessories"
        ),
        Product(
            id = "6",
            name = "Bluetooth Speaker",
            description = "Portable Bluetooth speaker with 360° sound.",
            price = 89.99,
            imageUrl = "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
            category = "Electronics"
        )
    )
    
    fun getById(id: String): Product? = products.find { it.id == id }
}

