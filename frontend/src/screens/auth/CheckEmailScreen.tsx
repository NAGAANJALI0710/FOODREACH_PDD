import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { AuthService } from '../../services/authService';
import { AppTheme } from '../../theme/theme';

interface CheckEmailScreenProps {
  theme: AppTheme;
  navigate: (screen: string) => void;
  email?: string;
}

export const CheckEmailScreen: React.FC<CheckEmailScreenProps> = ({
  theme,
  navigate,
  email = '',
}) => {
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle Resend Verification Email
  const handleResendEmail = async () => {
    if (cooldown > 0 || resending) return;

    if (!email) {
      setError('No email address provided. Please return to login.');
      return;
    }

    setResending(true);
    setMessage(null);
    setError(null);

    try {
      await AuthService.resendVerificationEmail(email);
      setMessage('A new verification email has been sent successfully. Please check your inbox.');
      setCooldown(60); // 60 seconds anti-spam timer
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {/* Email Icon Circle */}
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '18' }]}>
          <Mail size={44} color={theme.colors.primary} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.colors.text }]}>Check Your Email</Text>

        {/* Registered Email Address */}
        {!!email && (
          <View style={[styles.emailBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.emailText, { color: theme.colors.primary }]}>{email}</Text>
          </View>
        )}

        {/* Required Exact Message */}
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          A verification email has been sent to your email. Please check your inbox and click the verification link.
        </Text>

        {/* Success / Error Banners */}
        {message && (
          <View style={[styles.banner, { backgroundColor: theme.colors.success + '18', borderColor: theme.colors.success + '40' }]}>
            <CheckCircle2 size={16} color={theme.colors.success} style={{ marginRight: 8 }} />
            <Text style={[styles.bannerText, { color: theme.colors.success }]}>{message}</Text>
          </View>
        )}

        {error && (
          <View style={[styles.banner, { backgroundColor: theme.colors.error + '18', borderColor: theme.colors.error + '40' }]}>
            <AlertCircle size={16} color={theme.colors.error} style={{ marginRight: 8 }} />
            <Text style={[styles.bannerText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Resend Verification Email Button */}
        <TouchableOpacity
          id="btn-resend-verification"
          style={[
            styles.primaryBtn,
            {
              backgroundColor: cooldown > 0 ? theme.colors.surface : theme.colors.primary,
              borderColor: cooldown > 0 ? theme.colors.border : theme.colors.primary,
            },
          ]}
          onPress={handleResendEmail}
          disabled={cooldown > 0 || resending}
        >
          {resending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <RefreshCw
                size={16}
                color={cooldown > 0 ? theme.colors.textSecondary : '#FFFFFF'}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.primaryBtnText,
                  { color: cooldown > 0 ? theme.colors.textSecondary : '#FFFFFF' },
                ]}
              >
                {cooldown > 0 ? `Resend Verification Email (${cooldown}s)` : 'Resend Verification Email'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Back to Login Button */}
        <TouchableOpacity
          id="btn-back-to-login"
          style={styles.backBtn}
          onPress={() => navigate('Login')}
        >
          <ArrowLeft size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.backBtnText, { color: theme.colors.textSecondary }]}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'System',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
  },
  emailBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  emailText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'System',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    marginBottom: 16,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    fontFamily: 'System',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    borderRadius: 14,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'System',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'System',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default CheckEmailScreen;
