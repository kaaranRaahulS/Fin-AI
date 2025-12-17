import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import warnings
warnings.filterwarnings('ignore')
#Populating Random Data as we are limited with less trasaction due to sandbox environment.

# Categories and Cards Data
CATEGORIES = ["groceries", "dining", "travel", "gas", "online", "bills", "entertainment", "others"]

CARDS = {
    "Card_A": {"annual_fee": 0, "rates": {"groceries":0.03,"dining":0.02,"travel":0.01,"gas":0.01,"online":0.01,"bills":0.0,"entertainment":0.01,"others":0.0}},
    "Card_B": {"annual_fee": 95, "rates": {"groceries":0.01,"dining":0.03,"travel":0.05,"gas":0.0,"online":0.02,"bills":0.01,"entertainment":0.02,"others":0.0}},
    "Card_C": {"annual_fee": 0, "rates": {"groceries":0.02,"dining":0.01,"travel":0.0,"gas":0.03,"online":0.02,"bills":0.01,"entertainment":0.01,"others":0.0}},
    "Card_D": {"annual_fee": 0, "rates": {"groceries":0.01,"dining":0.01,"travel":0.02,"gas":0.0,"online":0.05,"bills":0.0,"entertainment":0.01,"others":0.0}},
    "Card_E": {"annual_fee": 450, "rates": {"groceries":0.04,"dining":0.03,"travel":0.05,"gas":0.02,"online":0.02,"bills":0.0,"entertainment":0.02,"others":0.01}},
}

# Initially we are populating "REALISTIC TRANSACTION DATA"
def generate_transactions_with_trends(n_months=12):
    np.random.seed(42)
    
    transactions = []
    start_date = datetime.now() - timedelta(days=n_months*30)
    
    for month in range(n_months):
        month_start = start_date + timedelta(days=month*30)
        
        growth_factor = 1 + (month * 0.02)  
        

        month_of_year = month_start.month
        if month_of_year in [11, 12]:  
            seasonal_factor = 1.4
        elif month_of_year in [6, 7, 8]: 
            seasonal_factor = 1.2
        else:
            seasonal_factor = 1.0
        
        category_base_counts = {
            "groceries": 25, "dining": 15, "travel": 3, "gas": 8,
            "online": 12, "bills": 5, "entertainment": 6, "others": 8
        }
        
        for category, base_count in category_base_counts.items():
            n_transactions = int(base_count * growth_factor * seasonal_factor * np.random.uniform(0.8, 1.2))
            
            for _ in range(n_transactions):
                day_offset = np.random.randint(0, 30)
                trans_date = month_start + timedelta(days=day_offset)
                
                if category == "travel":
                    amount = np.random.exponential(300) * seasonal_factor + 50
                elif category == "groceries":
                    amount = np.random.exponential(60) * growth_factor + 20
                elif category == "dining":
                    amount = np.random.exponential(40) * growth_factor + 15
                elif category == "gas":
                    amount = np.random.exponential(35) + 20
                elif category == "bills":
                    amount = np.random.normal(150, 30) * growth_factor
                else:
                    amount = np.random.exponential(50) + 10
                
                transactions.append({
                    'date': trans_date,
                    'category': category,
                    'amount': round(max(amount, 5), 2)
                })
    
    df = pd.DataFrame(transactions)
    df = df.sort_values('date').reset_index(drop=True)
    return df

#Then we are on to "FEATURE ENGINEERING". To provide the structural data for the model to train and predict. 
def create_monthly_features(transactions_df):
    """Create monthly aggregated features for ML"""
    
    df = transactions_df.copy()
    df['date'] = pd.to_datetime(df['date'])
    df['year_month'] = df['date'].dt.to_period('M')
    
    monthly_data = []
    
    for period in df['year_month'].unique():
        month_data = df[df['year_month'] == period]
        
        features = {
            'year_month': period,
            'month': period.month,
            'total_transactions': len(month_data),
            'total_spending': month_data['amount'].sum()
        }
        
        for category in CATEGORIES:
            cat_spending = month_data[month_data['category'] == category]['amount'].sum()
            features[f'spending_{category}'] = cat_spending
            features[f'count_{category}'] = len(month_data[month_data['category'] == category])
        
        monthly_data.append(features)
    
    monthly_df = pd.DataFrame(monthly_data)
    
    monthly_df['month_index'] = range(len(monthly_df))
    monthly_df['is_holiday_season'] = monthly_df['month'].isin([11, 12]).astype(int)
    monthly_df['is_summer'] = monthly_df['month'].isin([6, 7, 8]).astype(int)
    
    for category in CATEGORIES:
        monthly_df[f'spending_{category}_lag1'] = monthly_df[f'spending_{category}'].shift(1)
        monthly_df[f'spending_{category}_lag2'] = monthly_df[f'spending_{category}'].shift(2)
    
    monthly_df = monthly_df.fillna(0)
    
    return monthly_df

# Training the model for "EACH CATEGORY"
def train_spending_predictors(monthly_df):
    """Train separate models for each spending category"""
    
    models = {}
    predictions = {}
    metrics = {}
    
    feature_cols = ['month_index', 'month', 'is_holiday_season', 'is_summer', 
                    'total_transactions', 'total_spending']
    
    for category in CATEGORIES:
        print(f"\nTraining model for {category}...")
        
        cat_features = feature_cols + [f'spending_{category}_lag1', f'spending_{category}_lag2']
        
        X = monthly_df[cat_features].values
        y = monthly_df[f'spending_{category}'].values
        
        X_train, X_test = X[:-2], X[-2:]
        y_train, y_test = y[:-2], y[-2:]
        
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
 
        model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42, min_samples_split=3)
        model.fit(X_train_scaled, y_train)
        
        y_pred_train = model.predict(X_train_scaled)
        y_pred_test = model.predict(X_test_scaled)
        
        train_mae = mean_absolute_error(y_train, y_pred_train)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        
        models[category] = {'model': model, 'scaler': scaler, 'features': cat_features}
        predictions[category] = {'train': y_pred_train, 'test': y_pred_test}
        metrics[category] = {
            'train_mae': train_mae, 'test_mae': test_mae,
            'train_r2': train_r2, 'test_r2': test_r2
        }
        
        print(f"  Train MAE: ${train_mae:.2f}, R²: {train_r2:.3f}")
        print(f"  Test MAE:  ${test_mae:.2f}, R²: {test_r2:.3f}")
    
    return models, predictions, metrics


# We are predicting the users "FUTURE SPENDING"

def predict_future_spending(monthly_df, models, n_months_ahead=3):

    future_predictions = []
    current_df = monthly_df.copy()
    
    for future_month in range(n_months_ahead):
        last_row = current_df.iloc[-1].copy()
        
        new_month_index = last_row['month_index'] + 1
        new_month = (last_row['month'] % 12) + 1
        
        future_features = {
            'month_index': new_month_index,
            'month': new_month,
            'is_holiday_season': 1 if new_month in [11, 12] else 0,
            'is_summer': 1 if new_month in [6, 7, 8] else 0,
            'total_transactions': last_row['total_transactions'],
            'total_spending': last_row['total_spending']
        }
        
        predicted_spending = {}
        for category in CATEGORIES:
            model_info = models[category]
            model = model_info['model']
            scaler = model_info['scaler']
            feature_cols = model_info['features']
            
            features = [future_features.get(col, last_row[col]) for col in feature_cols]
            features_array = np.array(features).reshape(1, -1)
            features_scaled = scaler.transform(features_array)
            
            prediction = model.predict(features_scaled)[0]
            predicted_spending[category] = max(prediction, 0)  
            
            future_features[f'spending_{category}'] = prediction
            future_features[f'spending_{category}_lag1'] = last_row[f'spending_{category}']
            future_features[f'spending_{category}_lag2'] = last_row[f'spending_{category}_lag1']
        
        future_predictions.append({
            'month_ahead': future_month + 1,
            'month': new_month,
            'predictions': predicted_spending,
            'total_predicted': sum(predicted_spending.values())
        })
        
        new_row = last_row.copy()
        new_row['month_index'] = new_month_index
        new_row['month'] = new_month
        for category in CATEGORIES:
            new_row[f'spending_{category}'] = predicted_spending[category]
            new_row[f'spending_{category}_lag2'] = new_row[f'spending_{category}_lag1']
            new_row[f'spending_{category}_lag1'] = predicted_spending[category]
        
        current_df = pd.concat([current_df, pd.DataFrame([new_row])], ignore_index=True)
    
    return future_predictions

# Now we have the data, we can do "CARD PREDICTIONS"

def calculate_card_rewards(spending_profile, card_name):
    card = CARDS[card_name]
    total_rewards = sum(spending_profile[cat] * card["rates"][cat] for cat in CATEGORIES)
    net_rewards = total_rewards - card["annual_fee"]
    return net_rewards

def recommend_card_from_predictions(future_predictions):

    avg_predicted_spending = {category: 0 for category in CATEGORIES}
    
    for pred in future_predictions:
        for category in CATEGORIES:
            avg_predicted_spending[category] += pred['predictions'][category]
    
    n_months = len(future_predictions)
    for category in CATEGORIES:
        avg_predicted_spending[category] = (avg_predicted_spending[category] / n_months) * 12
    
    card_rewards = {}
    for card_name in CARDS.keys():
        rewards = calculate_card_rewards(avg_predicted_spending, card_name)
        card_rewards[card_name] = rewards
    
    sorted_cards = sorted(card_rewards.items(), key=lambda x: x[1], reverse=True)
    
    return sorted_cards, avg_predicted_spending

#Ouput
print("=" * 50)
print("FIN_AI CREDIT CARD RECOMMENDATION")
print("=" * 50)

print("\n[1] Generating transaction history (12 months)...")
transactions = generate_transactions_with_trends(n_months=12)
print(f"    Total transactions: {len(transactions)}")
print(f"    Date range: {transactions['date'].min().date()} to {transactions['date'].max().date()}")
print(f"    Total spending: ${transactions['amount'].sum():,.2f}")

print("\n[2] Creating monthly features...")
monthly_df = create_monthly_features(transactions)
print(f"    Monthly data points: {len(monthly_df)}")

print("\n    Recent Monthly Spending:")
print(monthly_df[['year_month'] + [f'spending_{cat}' for cat in CATEGORIES]].tail(3).to_string(index=False))


print("\n[3] Training ML models for each spending category...")
print("=" * 80)
models, predictions, metrics = train_spending_predictors(monthly_df)

print("\n" + "=" * 80)
print("[4] Predicting future spending for next 3 months...")
print("=" * 80)
future_predictions = predict_future_spending(monthly_df, models, n_months_ahead=3)

print("\nPredicted Monthly Spending:")
for pred in future_predictions:
    print(f"\n  Month {pred['month_ahead']} (Month {pred['month']}):")
    print(f"    Total: ${pred['total_predicted']:,.2f}")
    for category in CATEGORIES:
        amount = pred['predictions'][category]
        if amount > 10:
            print(f"      {category:15s}: ${amount:7,.2f}")

print("\n" + "=" * 80)
print("[5] Card Recommendation Based on Predicted Spending")
print("=" * 80)

sorted_recommendations, predicted_annual_spending = recommend_card_from_predictions(future_predictions)

print("\nPredicted Annual Spending by Category:")
for category in CATEGORIES:
    print(f"  {category:15s}: ${predicted_annual_spending[category]:8,.2f}")

print(f"\nTotal Predicted Annual Spending: ${sum(predicted_annual_spending.values()):,.2f}")

print("\n" + "=" * 80)
print("CARD RECOMMENDATIONS based on the model")
print("=" * 80)

for rank, (card_name, net_rewards) in enumerate(sorted_recommendations, 1):
    card = CARDS[card_name]
    gross_rewards = net_rewards + card['annual_fee']
    
    print(f"\n{rank}. {card_name}")
    print(f"   Predicted Gross Rewards: ${gross_rewards:,.2f}")
    print(f"   Annual Fee:             -${card['annual_fee']:,.2f}")
    print(f"   Predicted Net Rewards:   ${net_rewards:,.2f}")
    
    if rank == 1:
        print("RECOMMENDED CARD (Based on ML Predictions)")

# Step 6: Visualizations
print("\n[6] visual plots for understading")

fig, axes = plt.subplots(2, 2, figsize=(16, 12))

#Historical vs Predicted Spending
categories_to_plot = ["groceries", "dining", "travel", "online"]
ax = axes[0, 0]
for category in categories_to_plot:
    historical = monthly_df[f'spending_{category}'].values
    future_vals = [pred['predictions'][category] for pred in future_predictions]
    
    x_hist = range(len(historical))
    x_future = range(len(historical), len(historical) + len(future_vals))
    
    ax.plot(x_hist, historical, marker='o', label=f'{category} (historical)', linewidth=2)
    ax.plot(x_future, future_vals, marker='s', linestyle='--', label=f'{category} (predicted)', linewidth=2)

ax.axvline(x=len(monthly_df)-0.5, color='red', linestyle=':', linewidth=2, label='Prediction Start')
ax.set_title('Historical vs Predicted Spending', fontsize=14, fontweight='bold')
ax.set_xlabel('Month')
ax.set_ylabel('Spending ($)')
ax.legend()
ax.grid(True, alpha=0.3)

#Model Performance
ax = axes[0, 1]
categories = list(metrics.keys())
test_maes = [metrics[cat]['test_mae'] for cat in categories]
test_r2s = [metrics[cat]['test_r2'] for cat in categories]

x_pos = np.arange(len(categories))
ax.bar(x_pos, test_maes, color='coral')
ax.set_title('Model Prediction Error (Test MAE)', fontsize=14, fontweight='bold')
ax.set_xlabel('Category')
ax.set_ylabel('Mean Absolute Error ($)')
ax.set_xticks(x_pos)
ax.set_xticklabels(categories, rotation=45)

#Card Rewards Comparison
ax = axes[1, 0]
card_names = [card[0] for card in sorted_recommendations]
rewards = [card[1] for card in sorted_recommendations]
colors = ['green' if r == max(rewards) else 'skyblue' for r in rewards]

ax.bar(card_names, rewards, color=colors)
ax.set_title('Predicted Annual Net Rewards by Card', fontsize=14, fontweight='bold')
ax.set_xlabel('Card')
ax.set_ylabel('Predicted Net Rewards ($)')
ax.axhline(y=0, color='red', linestyle='--', alpha=0.5)

#Predicted Spending Distribution
ax = axes[1, 1]
predicted_amounts = [predicted_annual_spending[cat] for cat in CATEGORIES]
ax.pie(predicted_amounts, labels=CATEGORIES, autopct='%1.1f%%', startangle=90)
ax.set_title('Predicted Annual Spending Distribution', fontsize=14, fontweight='bold')

plt.tight_layout()
plt.show()

# ============================================
# FUNCTION FOR YOUR APP
# ============================================
def get_predictive_card_recommendation(transactions_df, n_months_ahead=3):
    """
    Complete ML-based recommendation system
    
    Parameters:
    -----------
    transactions_df : pandas.DataFrame
        Columns: ['date', 'category', 'amount']
    n_months_ahead : int
        Number of months to predict ahead
    
    Returns:
    --------
    dict with:
        - recommended_card
        - predicted_annual_rewards
        - future_predictions
        - model_metrics
    """
    monthly_df = create_monthly_features(transactions_df)
    models, _, metrics = train_spending_predictors(monthly_df)
    future_preds = predict_future_spending(monthly_df, models, n_months_ahead)
    sorted_cards, pred_spending = recommend_card_from_predictions(future_preds)
    
    return {
        'recommended_card': sorted_cards[0][0],
        'predicted_annual_rewards': sorted_cards[0][1],
        'all_cards_comparison': dict(sorted_cards),
        'future_predictions': future_preds,
        'predicted_annual_spending': pred_spending,
        'model_metrics': metrics
    }


print("\n To call out function for our FIN-AI app get_predictive_card_recommendation(our_transactions_df)")