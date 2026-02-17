# 🔧 MongoDB Connection Error Fix

## Error: `querySrv ENOTFOUND _mongodb._tcp.cluster0.auuy63f.mongodb.net`

This DNS error means your system cannot resolve the MongoDB Atlas cluster address.

---

## ✅ Quick Fixes (Try These First)

### 1. **Check if Cluster is Active**

Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/):
- Navigate to your cluster: `cluster0.auuy63f`
- Check if it shows **"Paused"** or **"Deleted"**
- If paused: Click **"Resume"** and wait 2-3 minutes
- If deleted: You'll need to create a new cluster

### 2. **Verify Connection String**

Your current connection string:
```
mongodb+srv://mariamali:***PASSWORD***@cluster0.auuy63f.mongodb.net/smartshop?appName=Cluster0
```

**Check:**
- ✅ Username: `mariamali` (correct?)
- ✅ Password: Is it correct? (URL-encode special characters)
- ✅ Cluster name: `cluster0.auuy63f` (matches Atlas?)
- ✅ Database: `smartshop` (exists?)

### 3. **Get Fresh Connection String**

1. Go to MongoDB Atlas → **Connect**
2. Choose **"Connect your application"**
3. Select **"Node.js"** and version **"5.5 or later"**
4. Copy the **NEW** connection string
5. Replace `<password>` with your actual password
6. Update `.env.local` file

---

## 🔄 Alternative: Use Direct Connection (Bypass DNS)

If DNS continues to fail, use a direct connection string instead of SRV:

### Step 1: Get Cluster IP Addresses

1. Go to MongoDB Atlas → Your Cluster → **Connect**
2. Click **"Connect your application"**
3. Look for **"Connection Options"** or **"Advanced Options"**
4. Find the **replica set members** (usually 3 IP addresses)

### Step 2: Create Direct Connection String

Replace your `mongodb+srv://` connection with:

```bash
mongodb://mariamali:PASSWORD@cluster0-shard-00-00.auuy63f.mongodb.net:27017,cluster0-shard-00-01.auuy63f.mongodb.net:27017,cluster0-shard-00-02.auuy63f.mongodb.net:27017/smartshop?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

**Note:** You'll need to get the actual replica set addresses from Atlas.

### Step 3: Update .env.local

```bash
# Change from:
MONGODB_URI=mongodb+srv://...

# To:
MONGODB_URI=mongodb://...
```

---

## 🌐 Network Troubleshooting

### Check Internet Connection
```bash
# Test DNS resolution
nslookup cluster0.auuy63f.mongodb.net

# Test connectivity
ping cluster0.auuy63f.mongodb.net
```

### Check Firewall/VPN
- **VPN**: Try disconnecting VPN
- **Firewall**: Check if MongoDB ports are blocked
- **Corporate Network**: May block MongoDB Atlas connections

### Try Different DNS Server
```bash
# Use Google DNS (temporary)
# macOS/Linux:
sudo networksetup -setdnsservers Wi-Fi 8.8.8.8 8.8.4.4

# Or edit /etc/resolv.conf
```

---

## 🔐 Common Issues & Solutions

### Issue 1: Cluster Paused
**Solution:** Resume cluster in MongoDB Atlas dashboard

### Issue 2: Wrong Password
**Solution:** 
- Reset password in MongoDB Atlas → Database Access
- URL-encode special characters: `@` → `%40`, `#` → `%23`, etc.

### Issue 3: IP Not Whitelisted
**Solution:**
1. MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (Allow from anywhere)
3. Wait 2-3 minutes

### Issue 4: Cluster Deleted
**Solution:** Create new cluster:
1. MongoDB Atlas → Create → Free Cluster
2. Choose region closest to you
3. Wait for deployment (3-5 minutes)
4. Get new connection string

---

## 🆕 Create New Cluster (If Needed)

If your cluster is deleted or unrecoverable:

### Step 1: Create Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click **"Create"** → **"Free Cluster"**
3. Choose:
   - **Provider**: AWS, Google Cloud, or Azure
   - **Region**: Closest to your location
   - **Cluster Tier**: M0 (Free)
4. Click **"Create Cluster"** (takes 3-5 minutes)

### Step 2: Create Database User
1. Go to **Database Access** → **Add New Database User**
2. Choose **"Password"** authentication
3. Username: `smartshop_user` (or your choice)
4. Password: Generate secure password (save it!)
5. Database User Privileges: **"Read and write to any database"**
6. Click **"Add User"**

### Step 3: Whitelist IP
1. Go to **Network Access** → **Add IP Address**
2. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
3. Or add your specific IP
4. Click **"Confirm"**

### Step 4: Get Connection String
1. Go to **Clusters** → Click **"Connect"**
2. Choose **"Connect your application"**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copy connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `smartshop`

### Step 5: Update .env.local
```bash
MONGODB_URI=mongodb+srv://smartshop_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/smartshop?retryWrites=true&w=majority
```

---

## 🧪 Test Connection

After fixing, test with:
```bash
node test-mongodb.js
```

Should see:
```
✅ SUCCESS! MongoDB connected successfully!
```

---

## 📞 Still Not Working?

### Check MongoDB Atlas Status
- Visit: https://status.mongodb.com/
- Check if there are any outages

### Try MongoDB Compass
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Try connecting with your connection string
3. If Compass works but Node.js doesn't → Node.js/DNS issue
4. If Compass fails too → MongoDB Atlas issue

### Contact Support
- MongoDB Atlas Support: https://www.mongodb.com/support
- Check MongoDB Community Forums

---

## ✅ Quick Checklist

- [ ] Cluster is active (not paused/deleted)
- [ ] Connection string is correct
- [ ] Password is correct (URL-encoded if needed)
- [ ] IP address is whitelisted (0.0.0.0/0)
- [ ] Internet connection is working
- [ ] No VPN blocking connection
- [ ] Database user has correct permissions
- [ ] `.env.local` file exists and has `MONGODB_URI`

---

## 🔗 Useful Links

- [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
- [MongoDB Connection String Guide](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [MongoDB Status Page](https://status.mongodb.com/)


