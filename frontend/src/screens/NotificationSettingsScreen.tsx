import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Switch, StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../theme';
import { Typography } from '../theme/typography';
import { storage } from '../services/storage';
import { STORAGE_KEYS } from '../constants/config';
import { NotificationSettings } from '../types';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

const defaultSettings: NotificationSettings = {
  pushEnabled: true,
  messagePreview: true,
  sound: true,
  vibration: true,
};

export default function NotificationSettingsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  const toggle = async (key: keyof NotificationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await storage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(updated));
  };

  const Item = ({ label, sub, settingKey }: { label: string; sub: string; settingKey: keyof NotificationSettings }) => (
    <View style={[styles.item, { borderBottomColor: theme.colors.divider }]}>
      <View style={styles.itemText}>
        <Text style={[styles.itemLabel, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.itemSub, { color: theme.colors.textSecondary }]}>{sub}</Text>
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={() => toggle(settingKey)}
        trackColor={{ false: theme.colors.border, true: theme.brand.primary + '88' }}
        thumbColor={settings[settingKey] ? theme.brand.primary : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity id="btn-back" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Item
            label="Push Notifications"
            sub="Receive alerts for new messages"
            settingKey="pushEnabled"
          />
          <Item
            label="Message Preview"
            sub="Show message content in notifications"
            settingKey="messagePreview"
          />
          <Item
            label="Sound"
            sub="Play sound for new messages"
            settingKey="sound"
          />
          <Item
            label="Vibration"
            sub="Vibrate for new messages"
            settingKey="vibration"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { ...Typography.h5 },
  section: { margin: 16, borderRadius: 16, overflow: 'hidden' },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1,
  },
  itemText: { flex: 1, marginRight: 16 },
  itemLabel: { ...Typography.bodyMedium, marginBottom: 3 },
  itemSub: { ...Typography.caption },
});
