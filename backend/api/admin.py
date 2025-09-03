from django.contrib import admin
from .models import User, UserPhoto, Interest, UserPreference, Swipe, Match, Message, ChatbotConversation, ChatbotMessage

# We are using a custom admin class to display more info for the User model
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'date_joined', 'last_login', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('-date_joined',)

# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(UserPhoto)
admin.site.register(Interest)
admin.site.register(UserPreference)
admin.site.register(Swipe)
admin.site.register(Match)
admin.site.register(Message)
admin.site.register(ChatbotConversation)
admin.site.register(ChatbotMessage)