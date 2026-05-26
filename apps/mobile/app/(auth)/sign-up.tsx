import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSignUp() {
    if (!isLoaded) return;
    setBusy(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert("Sign up failed", err?.errors?.[0]?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!isLoaded) return;
    setBusy(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/(tabs)");
      } else {
        Alert.alert("Verification incomplete", JSON.stringify(attempt, null, 2));
      }
    } catch (err: any) {
      Alert.alert("Verification failed", err?.errors?.[0]?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {pendingVerification ? "Check your inbox" : "Create account"}
      </Text>
      <Text style={styles.subtitle}>
        {pendingVerification
          ? "Enter the 6-digit code we emailed you."
          : "Start coaching with FitRix."}
      </Text>

      {!pendingVerification ? (
        <>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            autoCapitalize="none"
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable style={styles.button} onPress={handleSignUp} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </Pressable>
          <Link href="/(auth)/sign-in" style={styles.link}>
            Already have an account? Sign in
          </Link>
        </>
      ) : (
        <>
          <TextInput
            keyboardType="number-pad"
            placeholder="Verification code"
            style={styles.input}
            value={code}
            onChangeText={setCode}
          />
          <Pressable style={styles.button} onPress={handleVerify} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 12 },
  title: { fontSize: 28, fontWeight: "700", color: "#0f172a" },
  subtitle: { color: "#64748b", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#e76f51",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  link: { color: "#e76f51", textAlign: "center", marginTop: 16 },
});
