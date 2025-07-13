import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";
import * as FileSystem from "expo-file-system";

interface Category {
    name: string;
    description: string;
}

interface Customization {
    name: string;
    price: number;
    type: "topping" | "side" | "size" | "crust" | string;
}

interface MenuItem {
    name: string;
    description: string;
    image_url: string;
    price: number;
    rating: number;
    calories: number;
    protein: number;
    category_name: string;
    customizations: string[];
}

interface DummyData {
    categories: Category[];
    customizations: Customization[];
    menu: MenuItem[];
}

const data = dummyData as DummyData;

async function clearAll(collectionId: string): Promise<void> {
    const list = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId
    );

    await Promise.all(
        list.documents.map(async (doc) => {
            try {
                await databases.deleteDocument(
                    appwriteConfig.databaseId,
                    collectionId,
                    doc.$id
                );
            } catch (error) {
                // Ignore not found errors (404)
            }
        })
    );
}

async function clearStorage(): Promise<void> {
    const list = await storage.listFiles(appwriteConfig.bucketId);

    await Promise.all(
        list.files.map(async (file) => {
            try {
                await storage.deleteFile(appwriteConfig.bucketId, file.$id);
            } catch (error) {
                // Ignore not found errors
            }
        })
    );
}

async function uploadImageToStorage(imageUrl: string) {
    const fileName = imageUrl.split("/").pop() || `file-${Date.now()}.jpg`;
    const localUri = `${FileSystem.cacheDirectory}${fileName}`;

    const { uri, status } = await FileSystem.downloadAsync(imageUrl, localUri);
    if (status !== 200) {
        throw new Error(`Failed to download image: ${imageUrl}`);
    }

    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
        throw new Error(`File not found at: ${uri}`);
    }

    const fileObject = {
        name: fileName,
        type: "image/jpeg",
        size: fileInfo.size || 0,
        uri,
    };

    const file = await storage.createFile(
        appwriteConfig.bucketId,
        ID.unique(),
        fileObject
    );

    return storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
}

async function seed(): Promise<void> {
    try {
        // Clear old data
        await clearAll(appwriteConfig.categoriesCollectionId);
        await clearAll(appwriteConfig.customizationsCollectionId);
        await clearAll(appwriteConfig.menuCollectionId);
        await clearAll(appwriteConfig.menuCustomizationsCollectionId);
        await clearStorage();

        // Seed categories
        const categoryMap: Record<string, string> = {};
        for (const cat of data.categories) {
            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.categoriesCollectionId,
                ID.unique(),
                cat
            );
            categoryMap[cat.name] = doc.$id;
        }

        // Seed customizations
        const customizationMap: Record<string, string> = {};
        for (const cus of data.customizations) {
            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.customizationsCollectionId,
                ID.unique(),
                {
                    name: cus.name,
                    price: cus.price,
                    type: cus.type,
                }
            );
            customizationMap[cus.name] = doc.$id;
        }

        // Seed menu items and menu_customizations
        for (const item of data.menu) {
            const categoryId = categoryMap[item.category_name];
            if (!categoryId) {
                throw new Error(`Category not found: ${item.category_name}`);
            }

            const uploadedImage = await uploadImageToStorage(item.image_url);

            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.menuCollectionId,
                ID.unique(),
                {
                    name: item.name,
                    description: item.description,
                    image_url: uploadedImage,
                    price: item.price,
                    rating: item.rating,
                    calories: item.calories,
                    protein: item.protein,
                    categories: categoryId,
                }
            );

            for (const cusName of item.customizations) {
                const cusId = customizationMap[cusName];
                if (!cusId) {
                    throw new Error(`Customization not found: ${cusName}`);
                }

                await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.menuCustomizationsCollectionId,
                    ID.unique(),
                    {
                        menu: doc.$id,
                        customizations: cusId,
                    }
                );
            }
        }

        console.log("✅ Seeding complete.");
    } catch (error) {
        console.error("❌ Failed to seed the database:", error);
    }
}

export default seed;
