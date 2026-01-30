import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../config/envConfig';

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
};

export const comparePassword = async (enteredPassword: string, storedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(enteredPassword, storedPassword);
};