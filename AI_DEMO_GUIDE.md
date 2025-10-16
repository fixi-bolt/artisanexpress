# 🤖 AI Assistant Demo Guide

## Quick Test Scenarios

### 🚀 Testing the Full AI Chat Assistant

#### **Scenario 1: Water Leak Emergency**
1. Go to Home screen as client
2. Tap "✨ Assistant IA" button (purple button at bottom)
3. Type: `"J'ai une fuite d'eau sous l'évier, ça coule beaucoup"`
4. Send message
5. Wait for AI analysis
6. **Expected Result:**
   - Category: Plombier
   - Price estimate: ~80-150€
   - Urgency: 🔥 Urgent
   - Clear title and description
7. Tap "Créer la demande" to auto-create mission

#### **Scenario 2: Electrical Problem**
1. Open AI Assistant
2. Type: `"Les prises de ma chambre ne marchent plus depuis ce matin"`
3. **Expected Result:**
   - Category: Électricien
   - Price: ~60-120€
   - Urgency: ⚡ Modéré
4. Create mission if satisfied

#### **Scenario 3: Door Repair**
1. Open AI Assistant
2. Type: `"Ma porte d'entrée grince et ferme mal"`
3. **Expected Result:**
   - Category: Menuisier or Serrurier
   - Price: ~50-100€
   - Urgency: ✓ Non urgent
4. Note the confidence score

---

### 🎯 Testing Smart Category Suggestions

#### **Test 1: Wrong Category Selected**
1. From Home, select "Plombier" category
2. Fill title: `"Problème électrique"`
3. Fill description: `"Mes prises ne fonctionnent plus"`
4. Wait 1-2 seconds
5. **Expected Result:**
   - Blue AI suggestion box appears
   - Suggests "Électricien" instead
   - Shows confidence (should be 90%+)
   - Explanation in French
6. Tap "Utiliser" to change category
7. Notice header updates to "Électricien"

#### **Test 2: Correct Category**
1. Select "Électricien"
2. Fill title: `"Panne électrique"`
3. Fill description: `"Plus de courant dans une pièce"`
4. **Expected Result:**
   - AI may suggest same category (confidence check)
   - Or no suggestion if clearly correct

#### **Test 3: Dismiss Suggestion**
1. Trigger a category suggestion
2. Tap "Ignorer" button
3. **Expected Result:**
   - Suggestion disappears
   - Original category remains
   - Can continue normally

---

## 🎨 UI Elements to Check

### AI Assistant Screen (`/ai-assistant`)
- ✅ Sparkle icon in header
- ✅ Initial greeting message
- ✅ Three suggestion buttons
- ✅ Chat bubbles (user = right/purple, AI = left/white)
- ✅ AI icon in assistant messages
- ✅ Loading state with spinner
- ✅ Estimation card with:
  - Green checkmark icon
  - Category and mission title
  - Price box with € icon
  - Confidence badge
  - Urgency badge (color-coded)
  - "Créer la demande" button
- ✅ Input field at bottom
- ✅ Send button (disabled when empty)

### Smart Suggestion Component (in `/request`)
- ✅ Appears after description is filled
- ✅ Purple "Suggérer une catégorie avec l'IA" button
- ✅ Loading state
- ✅ Suggestion card with:
  - Sparkle icon
  - Confidence percentage badge
  - Category name in bold
  - Reasoning text
  - "Ignorer" and "Utiliser" buttons
- ✅ Error state if AI fails

### Home Screen
- ✅ Purple "Assistant IA" button at bottom
- ✅ Sparkle icon
- ✅ Title and subtitle visible
- ✅ Shadow effect
- ✅ Navigation to AI assistant works

---

## 🧪 Edge Cases to Test

### 1. Empty Input
- Try sending empty message → Should be disabled
- Clear description → Suggestion should disappear

### 2. Very Short Description
- Type just "fuite" → AI should ask for more details or provide general estimate

### 3. Ambiguous Problem
- Type "problème dans la maison" → AI should ask for clarification or provide lower confidence

### 4. Multiple Issues
- Type "fuite d'eau et problème électrique" → AI should pick primary issue or suggest splitting

### 5. Network Error
- Disconnect internet → Should show error message
- Reconnect → Should allow retry

### 6. Rapid Input
- Type fast and change description → Only latest should trigger AI

---

## 💡 Example Prompts to Test

### High Confidence (Should work well)
```
✅ "Fuite sous l'évier de la cuisine"
✅ "Plus de courant dans le salon"
✅ "Serrure bloquée, impossible d'ouvrir"
✅ "Porte qui grince beaucoup"
✅ "Repeindre le salon en blanc"
✅ "Voiture ne démarre plus"
✅ "Chauffage ne marche pas"
✅ "Tondre la pelouse et tailler les haies"
```

### Medium Confidence (May vary)
```
⚠️ "Problème dans la cuisine"
⚠️ "Réparation urgente"
⚠️ "Besoin d'aide"
```

### Low Confidence (Should show lower %)
```
❌ "Aide"
❌ "Problème"
❌ "Urgent"
```

---

## 🎬 Demo Flow (5 minutes)

**Perfect demo to show all features:**

1. **Start on Home** (0:00)
   - Show client home with categories
   - Point out "Assistant IA" button

2. **Open AI Assistant** (0:30)
   - Click purple button
   - Show chat interface
   - Show suggestion buttons

3. **Test with Water Leak** (1:00)
   - Click suggestion "J'ai une fuite d'eau sous l'évier"
   - Watch AI analyze (loading)
   - Show estimation card
   - Explain all details (price, urgency, category)
   - Create mission → Returns to home

4. **Show Smart Suggestions** (2:30)
   - Go to Home → Select wrong category (e.g., Plombier)
   - Type electrical problem
   - Wait for suggestion to appear
   - Show confidence score
   - Accept suggestion
   - Show category changed in header

5. **Complete Flow** (4:00)
   - Fill remaining fields
   - Submit request
   - Show success message

**Total time: 5 minutes**

---

## 📊 Success Metrics

### What to Observe:
- ⏱️ **Response Time**: AI should respond in 2-5 seconds
- 🎯 **Accuracy**: Category suggestions should be correct 85%+ of the time
- 💰 **Price Relevance**: Estimates should be realistic (50-200€ range typically)
- 🎨 **UI Polish**: Smooth animations, no flickering
- ❌ **Error Handling**: Graceful failures with retry options

---

## 🐛 Known Limitations

1. **AI may hallucinate**: Sometimes provides confident but wrong answers
2. **French only**: Designed for French market and language
3. **No photo analysis**: Text-based only in current version
4. **Generic prices**: Doesn't factor in location or artisan availability
5. **No memory**: Each conversation is independent

---

## 🎓 Tips for Best Results

### For Accurate Estimates:
✅ Provide specific problem description  
✅ Include location in house (kitchen, bathroom, etc.)  
✅ Mention urgency if relevant  
✅ Describe symptoms clearly  

### Example Good Prompt:
```
"Fuite d'eau importante sous l'évier de la cuisine. 
L'eau coule constamment, j'ai fermé l'arrivée d'eau. 
C'est urgent."
```

### Example Bad Prompt:
```
"Problème"
```

---

## 🎉 Wow Moments

These are the features that will impress users:

1. 🤖 **Instant Analysis**: AI understands problem in seconds
2. 💰 **Accurate Prices**: Realistic market rates with ranges
3. 🎯 **Auto-categorization**: No need to know which artisan
4. ⚡ **Urgency Detection**: Automatically flags emergencies
5. ✨ **One-tap Creation**: From description to mission in 1 click
6. 🔄 **Smart Corrections**: Suggests better category if needed
7. 🎨 **Beautiful UI**: Modern, polished, professional

---

**Ready to demo! The AI features are fully functional and ready to impress users! 🚀**
