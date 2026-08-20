import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { HelpCircle, AlertTriangle, CheckCircle2, PackageCheck, X, Truck, Star } from 'lucide-react-native';
import { AppTheme } from '../theme/theme';

export interface ConfirmationModalProps {
  visible: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  icon?: 'accept' | 'pickup' | 'complete' | 'warning' | 'info';
  loading?: boolean;
  theme: AppTheme;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title = 'Confirmation Required',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor,
  icon = 'info',
  loading = false,
  theme,
  onConfirm,
  onCancel,
}) => {
  if (!visible) return null;

  const primaryBtnColor = confirmColor || theme.colors.primary;

  const renderIcon = () => {
    switch (icon) {
      case 'accept':
        return <CheckCircle2 size={32} color={theme.colors.primary} />;
      case 'pickup':
        return <PackageCheck size={32} color="#F97316" />;
      case 'complete':
        return <Star size={32} color={theme.colors.success} />;
      case 'warning':
        return <AlertTriangle size={32} color={theme.colors.warning} />;
      default:
        return <HelpCircle size={32} color={theme.colors.primary} />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onCancel} id="btn-confirm-dialog-close">
            <X size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.iconBox, { backgroundColor: primaryBtnColor + '15' }]}>
            {renderIcon()}
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              id="btn-confirm-dialog-cancel"
              style={[styles.btn, styles.cancelBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={[styles.btnText, { color: theme.colors.text }]}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              id="btn-confirm-dialog-proceed"
              style={[styles.btn, styles.confirmBtn, { backgroundColor: primaryBtnColor }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={[styles.btnText, { color: '#FFF' }]}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'System',
  },
});

export default ConfirmationModal;
