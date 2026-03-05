import crypto from 'crypto';

export const generatePublicPatientID = (): string => {
    // Generate 12 random bytes and converts it to digits

    let result = '';
    while (result.length < 12){
        // randomBytes generates one random byte of data, 
        // which is a number between 0 and 255
        const byte = crypto.randomBytes(1).readUInt8(0);

        // Only take digits 0-9
        // if statement to give each digit equal probability to be chosen
        if (byte < 250){
            result += (byte % 10).toString();
        }
    }

    console.log(`Public ID generated: ${result}`);

    return result;
}