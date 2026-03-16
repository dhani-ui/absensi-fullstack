package main

import (
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Model Absensi
type Absensi struct {
    ID             uint    `gorm:"primaryKey" json:"id"`
    Nama           string  `json:"nama"`
    Tanggal        string  `json:"tanggal"`
    Kelas          string  `json:"kelas"`
    Keterangan     string  `json:"keterangan"`
    FaceDescriptor string  `json:"face_descriptor"` // Simpan array koordinat wajah
    CreatedAt      time.Time `json:"created_at"`
}


// Tambahkan ini tepat di bawah struct Absensi
func (Absensi) TableName() string {
    return "absensi"
}


var DB *gorm.DB

func initDB() {
	dsn := "host=localhost user=postgres dbname=absensi_db port=5432 sslmode=disable TimeZone=Asia/Jakarta"
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Gagal koneksi ke database:", err)
	}
	DB.AutoMigrate(&Absensi{})
}

func main() {
	initDB()
	r := gin.Default()

	// Setup CORS (Sangat penting agar React bisa menembak API ini)
	r.Use(cors.Default())

	// Routes CRUD
	r.GET("/api/absensi", func(c *gin.Context) {
		var data []Absensi
		DB.Order("tanggal desc").Find(&data)
		c.JSON(200, data)
	})

	r.POST("/api/absensi", func(c *gin.Context) {
		var input Absensi
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		DB.Create(&input)
		c.JSON(201, input)
	})

	r.DELETE("/api/absensi/:id", func(c *gin.Context) {
		id := c.Param("id")
		DB.Delete(&Absensi{}, id)
		c.JSON(200, gin.H{"message": "Data dihapus"})
	})

	r.Run(":8080") // Berjalan di port 8080
}
