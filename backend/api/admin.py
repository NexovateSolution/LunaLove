from django.contrib import admin
from .models import User, UserPhoto, Interest, UserPreference, Swipe, Match, Message, ChatbotConversation, ChatbotMessage
from payments.models import Wallet

# We are using a custom admin class to display more info for the User model
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'date_joined', 'last_login', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('-date_joined',)
    actions = ("ensure_wallets", "ensure_wallets_for_all",)

    def ensure_wallets(self, request, queryset):
        """Create Wallet entries for the selected users if missing."""
        created = 0
        for user in queryset:
            _, was_created = Wallet.objects.get_or_create(user=user)
            if was_created:
                created += 1
        self.message_user(request, f"Ensured wallets for selected users. Newly created: {created}")
    ensure_wallets.short_description = "Ensure wallets for selected users"

    def ensure_wallets_for_all(self, request, queryset):
        """Create Wallet entries for ALL users if missing (ignores selection)."""
        created = 0
        for user in User.objects.all().only('id'):
            _, was_created = Wallet.objects.get_or_create(user=user)
            if was_created:
                created += 1
        self.message_user(request, f"Ensured wallets for ALL users. Newly created: {created}")
    ensure_wallets_for_all.short_description = "Ensure wallets for ALL users"

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