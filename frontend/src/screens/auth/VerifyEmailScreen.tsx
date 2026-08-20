import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { CheckCircle2, AlertCircle, RefreshCw, Mail, ArrowLeft } from 'lucide-react-native';
import { AuthService } from '../../services/authService';
import { AppTheme } from '../../theme/theme';

interface VerifyEmailScreenProps {
  theme: AppTheme;
  navigate: (screen: string) => void;
  email?: string;
  code?: string;
}

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({
  theme,
  navigate,
  email: initialEmail = '',
  code: initialCode = '',
}) => {
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [codeInput, setCodeInput] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Extract query params from URL if on web
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const urlEmail = params.get('email');
      const urlCode = params.get('code') || params.get('token');
      if (urlEmail) setEmailInput(urlEmail);
      if (urlCode) setCodeInput(urlCode);
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-verify if both email and code are provided via URL or props
  useEffect(() => {
    if (emailInput && codeInput && !verifiedSuccess && !verifying) {
      handleVerify(emailInput, codeInput);
    }
  }, [emailInput, codeInput]);

  const handleVerify = async (targetEmail = emailInput, targetCode = codeInput) => {
    if (!targetEmail || !targetCode) {
      setError('Please provide both email address and 6-digit verification code.');
      return;
    }

    setVerifying(true);
    setError(null);
    setMessage(null);

    try {
      const res = await AuthService.verifyEmail(targetEmail, targetCode);
      if (res && res.success) {
        setVerifiedSuccess(true);
        setMessage(res.message || 'Email verified successfully! You can now log in.');
      } else {
        setError(res?.message || 'Verification failed. Invalid or expired code.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    if (!emailInput) {
      setError('Please enter your email address to resend verification.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await AuthService.resendVerificationEmail(emailInput);
      if (res && res.success) {
        setMessage('A new verification email has been sent successfully. Please check your inbox.');
        setCooldown(60);
      } else {
        setError(res?.message || 'Unable to send verification email. Please try again later.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to send verification email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: verifiedSuccess ? theme.colors.success + '18' : theme.colors.primary + '18' },
          ]}
        >
          {verifiedSuccess ? (
            <CheckCircle2 size={44} color={theme.colors.success} />
          ) : (
            <Mail size={44} color={theme.colors.primary} />
          )}
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          {verifiedSuccess ? 'Email Verified! 🎉' : 'Verify Your Email'}
        </Text>

        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {verifiedSuccess
            ? 'Your email address has been successfully verified. You can now access your FoodReach account.'
            : 'Enter the 6-digit verification code sent to your email or click the link in the email.'}
        </Text>

        {/* Message Banner */}
        {message && (
          <View style={[styles.banner, { backgroundColor: theme.colors.success + '18', borderColor: theme.colors.success + '40' }]}>
            <CheckCircle2 size={16} color={theme.colors.success} style={{ marginRight: 8 }} />
            <Text style={[styles.bannerText, { color: theme.colors.success }]}>{message}</Text>
          </View>
        )}

        {/* Error Banner */}
        {error && (
          <View style={[styles.banner, { backgroundColor: theme.colors.error + '18', borderColor: theme.colors.error + '40' }]}>
            <AlertCircle size={16} color={theme.colors.error} style={{ marginRight: 8 }} />
            <Text style={[styles.bannerText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        )}

        {!verifiedSuccess && (
          <View style={styles.form}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Email Address</Text>
            <TextInput
              id="input-verify-email"
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              placeholder="name@example.com"
              placeholderTextColor={theme.colors.textSecondary + '80'}
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>6-Digit Verification Code</Text>
            <TextInput
              id="input-verify-code"
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, letterSpacing: 4, textAlign: 'center', fontSize: 18, fontWeight: '700' }]}
              placeholder="123456"
              placeholderTextColor={theme.colors.textSecondary + '80'}
              value={codeInput}
              onChangeText={setCodeInput}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              id="btn-submit-verification"
              style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleVerify()}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Verify Email</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              id="btn-resend-verification"
              style={[
                styles.secondaryBtn,
                {
                  backgroundColor: cooldown > 0 ? theme.colors.surface : 'transparent',
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={handleResend}
              disabled={cooldown > 0 || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <>
                  <RefreshCw size={14} color={cooldown > 0 ? theme.colors.textSecondary : theme.colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.secondaryBtnText, { color: cooldown > 0 ? theme.colors.textSecondary : theme.colors.primary }]}>
                    {cooldown > 0 ? `Resend Email (${cooldown}s)` : 'Resend Verification Email'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          id="btn-back-to-login"
          style={styles.backBtn}
          onPress={() => navigate('Login')}
        >
          <ArrowLeft size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.backBtnText, { color: theme.colors.textSecondary }]}>
            {verifiedSuccess ? 'Proceed to Login' : 'Back to Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
    flex: 1,
  },
  form: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontSize: 14,
    fontFamily: 'System',
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'System',
  },
  secondaryBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'System',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default VerifyEmailScreen;
