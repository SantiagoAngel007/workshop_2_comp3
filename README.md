# 🏋️‍♂️ Gym Management System - User Module

## 👥 Equipo de Desarrollo
* Luis Manuel Rojas Correa
* Santiago Angel Ordoñez
* Cristian Molina Vides
* Juan Camilo Corrales Osvath

## 📋 Descripción del Proyecto

📋 Descripción del Proyecto
Sistema de gestión de gimnasio desarrollado en NestJS con TypeScript. Este módulo maneja toda la funcionalidad relacionada con usuarios, autenticación, roles y permisos.

Cómo usar el método update:

PATCH http://localhost:3000/subscriptions/{id}

Headers:
•  Authorization: Bearer {admin_token}
•  Content-Type: application/json

Body (todos los campos son opcionales):
json
Nota: El campo membershipIds reemplazará todas las membresías actuales por las nuevas. Si quieres agregar una membresía sin reemplazar las existentes, usa el endpoint:

POST /subscriptions/{id}/memberships


