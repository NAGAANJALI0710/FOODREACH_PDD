import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Plus,
  Search,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  X,
  User,
  Users,
  CheckCircle2,
  Clock,
  MinusCircle
} from 'lucide-react-native';
import { RootState } from '../../store';
import { AppTheme } from '../../theme/theme';
import { VolunteerService, VolunteerItem, VolunteerStatus } from '../../services/volunteerService';

interface NgoVolunteersScreenProps {
  theme: AppTheme;
  navigate: (screen: string) => void;
}

export const NgoVolunteersScreen: React.FC<NgoVolunteersScreenProps> = ({ theme, navigate }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [volunteers, setVolunteers] = useState<VolunteerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<VolunteerItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formStatus, setFormStatus] = useState<VolunteerStatus>('Available');
  const [saving, setSaving] = useState(false);

  const fetchVolunteers = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await VolunteerService.getVolunteers(user.id);
      setVolunteers(data || []);
    } catch {
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  const openAddModal = () => {
    setEditingVolunteer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormStatus('Available');
    setModalVisible(true);
  };

  const openEditModal = (item: VolunteerItem) => {
    setEditingVolunteer(item);
    setFormName(item.name);
    setFormPhone(item.phone);
    setFormEmail(item.email || '');
    setFormAddress(item.address || '');
    setFormStatus(item.status);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      alert('Please enter volunteer full name');
      return;
    }
    if (!formPhone.trim()) {
      alert('Please enter volunteer mobile number');
      return;
    }

    setSaving(true);
    try {
      if (editingVolunteer) {
        await VolunteerService.updateVolunteer(editingVolunteer.id, {
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          address: formAddress.trim(),
          status: editingVolunteer.status,
        });
      } else {
        await VolunteerService.addVolunteer(user?.id || 'ngo_1', {
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          address: formAddress.trim(),
          status: 'Available',
        });
      }
      setModalVisible(false);
      await fetchVolunteers();
    } catch (err: any) {
      alert(err.message || 'Failed to save volunteer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: VolunteerItem) => {
    try {
      await VolunteerService.deleteVolunteer(item.id);
      setVolunteers(prev => prev.filter(v => v.id !== item.id));
    } catch {
      setVolunteers(prev => prev.filter(v => v.id !== item.id));
    }
  };

  const filteredVolunteers = volunteers.filter(v => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      v.name.toLowerCase().includes(q) ||
      v.phone.includes(q) ||
      (v.email && v.email.toLowerCase().includes(q))
    );
  });

  const getInitials = (name: string) => {
    if (!name) return 'V';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderVolunteerItem = ({ item }: { item: VolunteerItem }) => {
    return (
      <View
        id={`volunteer-card-${item.id}`}
        style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      >
        <View style={styles.cardMain}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primary + '1F' }]}>
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{getInitials(item.name)}</Text>
          </View>

          <View style={styles.cardInfo}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Phone size={13} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.detailText, { color: theme.colors.text }]}>{item.phone}</Text>
            </View>

            {Boolean(item.email) && (
              <View style={styles.detailRow}>
                <Mail size={13} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.detailText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {item.email}
                </Text>
              </View>
            )}

            {Boolean(item.address) && (
              <View style={styles.detailRow}>
                <MapPin size={13} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.detailText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.cardActionRow, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            id={`btn-edit-vol-${item.id}`}
            style={styles.actionBtn}
            onPress={() => openEditModal(item)}
          >
            <Edit2 size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>Edit</Text>
          </TouchableOpacity>

          <View style={[styles.actionDivider, { backgroundColor: theme.colors.border }]} />

          <TouchableOpacity
            id={`btn-delete-vol-${item.id}`}
            style={styles.actionBtn}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={14} color={theme.colors.error} style={{ marginRight: 4 }} />
            <Text style={[styles.actionBtnText, { color: theme.colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          id="btn-volunteers-back"
          style={styles.backBtn}
          onPress={() => navigate('Dashboard')}
        >
          <ArrowLeft size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Volunteers</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            {volunteers.length} registered field volunteers
          </Text>
        </View>
        <TouchableOpacity
          id="btn-add-volunteer-header"
          style={[styles.addHeaderBtn, { backgroundColor: theme.colors.primary }]}
          onPress={openAddModal}
        >
          <Plus size={16} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={styles.addHeaderBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Search size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            id="input-volunteer-search"
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search volunteers by name or phone..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} id="btn-clear-vol-search">
              <X size={14} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Volunteer List */}
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : filteredVolunteers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No volunteers found.</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Add a volunteer first to assign them to food pickup & deliveries.
          </Text>
          <TouchableOpacity
            id="btn-empty-add-volunteer"
            style={[styles.emptyBtn, { backgroundColor: theme.colors.primary }]}
            onPress={openAddModal}
          >
            <Plus size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.emptyBtnText}>Add Volunteer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredVolunteers}
          keyExtractor={item => item.id}
          renderItem={renderVolunteerItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}



      {/* Add / Edit Volunteer Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingVolunteer ? 'Edit Volunteer' : 'Add New Volunteer'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} id="btn-vol-modal-close">
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Full Name *</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <User size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  id="input-vol-name"
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholder="E.g. Ravi Kumar"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>

              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Mobile Number *</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Phone size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  id="input-vol-phone"
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholder="E.g. 9876543210"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                  value={formPhone}
                  onChangeText={setFormPhone}
                />
              </View>

              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Email Address (Optional)</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Mail size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  id="input-vol-email"
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholder="E.g. ravi@example.com"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formEmail}
                  onChangeText={setFormEmail}
                />
              </View>

              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Address (Optional)</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <MapPin size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  id="input-vol-address"
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholder="E.g. Connaught Place, New Delhi"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formAddress}
                  onChangeText={setFormAddress}
                />
              </View>

              <TouchableOpacity
                id="btn-vol-modal-save"
                style={[styles.saveBtn, { backgroundColor: theme.colors.primary, marginTop: 20 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingVolunteer ? 'Update Volunteer' : 'Save Volunteer'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addHeaderBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
    padding: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardActionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: 40,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionDivider: {
    width: 1,
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
  },
  modalStatusChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveBtn: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default NgoVolunteersScreen;
