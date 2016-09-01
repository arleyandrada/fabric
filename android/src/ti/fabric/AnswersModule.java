package ti.fabric;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Currency;
import java.util.HashMap;
import java.util.Iterator;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.util.TiConvert;

import com.crashlytics.android.answers.Answers;
import com.crashlytics.android.answers.AnswersEvent;
import com.crashlytics.android.answers.CustomEvent;
import com.crashlytics.android.answers.PurchaseEvent;
import com.crashlytics.android.answers.SignUpEvent;

@Kroll.module(parentModule=FabricModule.class)
public class AnswersModule extends KrollModule {

	@SuppressWarnings({ "rawtypes" })
	private void parseCustomAttributes(HashMap args, AnswersEvent ae) {
		HashMap cAttributes = (HashMap) args.get("customAttributes");
		if (cAttributes != null) {
			Iterator iterator = cAttributes.keySet().iterator();
			while (iterator. hasNext()) {
				String key = iterator.next().toString();
				Object value = cAttributes.get(key);
				if (value instanceof Number) {
					ae.putCustomAttribute(key, (Number) value);
				} else {
					NumberFormat nf = NumberFormat.getInstance();
					try {
						ae.putCustomAttribute(key, nf.parse(value.toString()));
					} catch (Exception e) {
						ae.putCustomAttribute(key, value.toString());
					}
				}
			}
		}
	}

	@SuppressWarnings({ "rawtypes", "unchecked" })
	@Kroll.method(runOnUiThread=true)
	public void logCustomEventWithName(HashMap args) {
		String name = TiConvert.toString(args, "name");
		CustomEvent ce = new CustomEvent(name);
		parseCustomAttributes(args, ce);
		Answers.getInstance().logCustom(ce);
	} 
	
	@SuppressWarnings({ "rawtypes", "unchecked" })
	@Kroll.method(runOnUiThread=true)
	public void logPurchaseWithPrice(HashMap args) {
		PurchaseEvent pe = new PurchaseEvent();
		String price = TiConvert.toString(args, "price");
		String currency = TiConvert.toString(args, "currency");
		Boolean success = TiConvert.toBoolean(args, "success", true);
		String itemName = TiConvert.toString(args, "itemName");
		String itemType = TiConvert.toString(args, "itemType");
		String itemId = TiConvert.toString(args, "itemId");
		pe.putItemPrice(new BigDecimal(price));
		pe.putCurrency(Currency.getInstance(currency));
		pe.putSuccess(success);
		pe.putItemName(itemName);
		pe.putItemType(itemType);
		pe.putItemId(itemId);
		parseCustomAttributes(args, pe);
		Answers.getInstance().logPurchase(pe);
	}

	@SuppressWarnings({ "rawtypes", "unchecked" })
	@Kroll.method(runOnUiThread=true)
	public void logSignUpWithMethod(HashMap args) {
		SignUpEvent su = new SignUpEvent();
		String method = TiConvert.toString(args, "method");
		Boolean success = TiConvert.toBoolean(args, "success", true);
		su.putMethod(method);
		su.putSuccess(success);
		parseCustomAttributes(args, su);
		Answers.getInstance().logSignUp(su);
	}
}