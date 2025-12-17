// frontend/app/plaid.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from 'expo-router';
import { Feather } from "@expo/vector-icons";

import {
  create,
  open,
  LinkTokenConfiguration,
  LinkSuccess,
  LinkExit,
  LinkLogLevel,
} from "react-native-plaid-link-sdk";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";

export default function PlaidScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidItemId, setPlaidItemId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<string>(
    "No transactions yet."
  );
  const [loadingLinkToken, setLoadingLinkToken] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const userId = user?.id;

  if (!userId) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Feather
            name="arrow-left"
            size={24}
            color="#0d9488"
            onPress={() => router.back()} // Changed to goBack()
            style={styles.backButton}
          />
          <Text style={styles.header}>Link Bank Account</Text>
        </View>

        <Text>You must be logged in to link a bank.</Text>
      </View>
    );
  }

  // 1️⃣ Ask backend for link_token and preload Link
  const createLinkToken = async () => {
    try {
      setLoadingLinkToken(true);
      const resp = await axios.post(
        `${API_BASE_URL}/api/plaid/create_link_token`,
        { userId }
      );
      const token = resp.data.link_token;
      setLinkToken(token);

      // Preload Plaid Link with this token
      const config: LinkTokenConfiguration = {
        token,
        // optional: noLoadingState: false,
      };
      create(config);

      Alert.alert("Success", "Link token created & Link preloaded!");
    } catch (e: any) {
      console.error("createLinkToken error:", e?.response?.data ?? e);
      Alert.alert("Error", "Failed to create link token");
    } finally {
      setLoadingLinkToken(false);
    }
  };

  // 2️⃣ Open Plaid Link (native SDK)
  const openPlaidLink = () => {
    if (!linkToken) {
      Alert.alert("Error", "Create a link token first");
      return;
    }


    open({
      onSuccess: async (success: LinkSuccess) => {
        try {

          const publicToken = success.publicToken;
          const institution = success.metadata.institution;

          const resp = await axios.post(
            `${API_BASE_URL}/api/plaid/get_access_token`,
            {
              userId,
              publicToken,
              institution,
            }
          );


          setPlaidItemId(resp.data.plaidItemId);
          Alert.alert("Success", "Bank linked!");
        } catch (err: any) {
          console.error(
            "Error exchanging public token:",
            err?.response?.data ?? err
          );
          Alert.alert("Error", "Failed to save linked account");
        }
      },
      onExit: (exit: LinkExit) => {
        if (exit.error) {
          Alert.alert(
            "Error",
            "There was an issue linking your account. Please try again."
          );
        }
      },
      logLevel: LinkLogLevel.ERROR,
      // iosPresentationStyle: "MODAL", // optional
    });
  };

  // 3️⃣ Sync + display transactions via backend
  const fetchTransactions = async () => {
    if (!plaidItemId) {
      Alert.alert("Error", "Link an account first");
      return;
    }

    try {
      setLoadingTransactions(true);
      const resp = await axios.post(
        `${API_BASE_URL}/api/plaid/transactions/sync`,
        {
          userId,
          plaidItemId
        }
      );

      setTransactions(JSON.stringify(resp.data.transactions, null, 2));
    } catch (e: any) {
      console.error("fetchTransactions error:", e?.response?.data ?? e);
      Alert.alert("Error", "Failed to fetch transactions");
    } finally {
      setLoadingTransactions(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color="#0D9488" />
        </TouchableOpacity>
        <Text style={styles.header}>Plaid Integration</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, loadingLinkToken && styles.buttonDisabled]}
            onPress={createLinkToken}
            disabled={loadingLinkToken}
          >
            <Text style={styles.buttonText}>
              {loadingLinkToken ? 'Creating Link Token...' : '1. Create Link Token (preload)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !linkToken && styles.buttonDisabled, { backgroundColor: '#4F46E5' }]}
            onPress={openPlaidLink}
            disabled={!linkToken}
          >
            <Text style={styles.buttonText}>2. Open Plaid</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, (!plaidItemId || loadingTransactions) && styles.buttonDisabled, { backgroundColor: '#10B981' }]}
            onPress={fetchTransactions}
            disabled={!plaidItemId || loadingTransactions}
          >
            <Text style={styles.buttonText}>
              {loadingTransactions ? 'Fetching Transactions...' : '3. Fetch Transactions'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.txContainer}>
          <Text style={styles.transactionText}>
            {transactions}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'left',
    marginLeft: 8,
    marginBottom: 0,
  },
  button: {
    backgroundColor: '#0D9488',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  txContainer: {
    flex: 1,
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  transactionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
