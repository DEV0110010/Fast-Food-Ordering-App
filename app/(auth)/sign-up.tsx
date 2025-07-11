import {View, Text, Button, Alert} from 'react-native'
import React, {useState} from 'react'
import {Link, router} from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import {createUser} from "@/lib/appwrite";

const SignUp = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setFrom] = useState({name:"", email: "", password: ""});

    const submit = async () => {
        const {name, email, password} = form;
        if(!name || !email || !password) return Alert.alert("Error", "Please fill in all fields (name, email, and password).");

        setIsSubmitting(true);

        try{
            await createUser({email, password, name,});

            Alert.alert('Success', 'User Signed Up Successfully');
            router.replace("/")
        }catch (error: any) {
            Alert.alert('Error', error.message);
        }finally {
            setIsSubmitting(false);
        }
    }
    return (
        <View className="gap-10 bg-white rounded-lg p-5 mt-5">
            <CustomInput
                placeholder="Enter Your name"
                value={form.name}
                onChangeText={(text) =>setFrom((prev) => ({...prev, name: text}))}
                label="Full Name"
            />
            <CustomInput
                placeholder="Enter Your email"
                value={form.email}
                onChangeText={(text) =>setFrom((prev) => ({...prev, email: text}))}
                label="Email"
                keyboardType="email-address"
            />
            <CustomInput
                placeholder="Enter Your password"
                value={form.password}
                onChangeText={(text) =>setFrom((prev) => ({...prev, password: text}))}
                label="Password"
                secureTextEntry={true}
            />
            <CustomButton
                title="Sign Up"
                isLoading={isSubmitting}
                onPress={submit}
            />

            <View className="flex justify-center mt-5 flex-row gap-2">
                <Text className="base-regular text-gray-100">
                    Already have an account?
                </Text>
                <Link className="base-bold text-primary" href="/sign-in">
                    Sign In
                </Link>
            </View>
        </View>
    )
}
export default SignUp
