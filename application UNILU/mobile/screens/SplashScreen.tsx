import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Image, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onAnimationComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const translateYAnim = useRef(new Animated.Value(20)).current;

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Pulse animation logic
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );

        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    useNativeDriver: true,
                }),
                Animated.timing(translateYAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ]),
            Animated.delay(2500), // Increased delay for longer duration
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1.5,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            onAnimationComplete();
        });

        pulse.start();

        return () => pulse.stop();
    }, [fadeAnim, scaleAnim, translateYAnim, pulseAnim, onAnimationComplete]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <LinearGradient
                colors={['#E0F2FE', '#FFFFFF']} // Light blue (Sky 100) to White
                style={styles.gradient}
            >
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { scale: scaleAnim },
                                { scale: pulseAnim },
                                { translateY: translateYAnim }
                            ],
                        },
                    ]}
                >
                    <Image
                        source={require('../assets/unilu-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Animated.Text style={styles.title}>UNILU</Animated.Text>
                    <Animated.Text style={styles.subtitle}>Université de Lubumbashi</Animated.Text>
                </Animated.View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: width * 0.8,
        height: width * 0.8,
        marginBottom: 20,
    },
    title: {
        fontSize: 48, // Adjusted from 72 for better balance with logo
        fontWeight: '900',
        color: '#1e3a8a',
        letterSpacing: 6,
        textShadowColor: 'rgba(30, 58, 138, 0.1)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 10,
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
});
